<script setup lang="ts">
import {useFetch, useUrlSearchParams, useSessionStorage} from "@vueuse/core";
import {computed, reactive, watch} from "vue";

import {UrlParams, SessionKeys} from "../types/Url.types.ts";
import ElementsTabs from "@/components/ElementsTabs.vue";
import ElementsInput from "@/components/form/ElementsInput.vue";
import { useI18n } from "@/composibles/useI18n.ts";
import type {AbstractQuery, Facet} from "@/types/Query.types.ts";

interface Props {
  apiUrl: string;
  detailUrl?: string;
  lang?: string;
}

const props = withDefaults(defineProps<Props>(), {
  detailUrl: '/detail/:uid',
  lang: 'nl',
});

const { t, n, lang, } = useI18n(props.lang);

type UrlStore = Record<string, string | string[] | null>;
const SearchParams = useUrlSearchParams<UrlStore>("hash-params", {write: true,});

// Persist search params to session storage so other pages can access them
// Store a plain object snapshot to avoid saving proxies/refs
const storedSearchParams = useSessionStorage<Record<string, string | string[]>>(
  SessionKeys.searchParams,
  {}
);

// Hydrate URL params from sessionStorage if URL has none but session has values
try {
  const hasUrlParams = Object.keys(SearchParams).length > 0;
  const hasStored = storedSearchParams.value && Object.keys(storedSearchParams.value).length > 0;
  if (!hasUrlParams && hasStored) {
    for (const [key, value] of Object.entries(storedSearchParams.value)) {
      // assign back into reactive SearchParams
      SearchParams[key] = value ?? null;
    }
  }
} catch {
  // no-op: hydration is best-effort
}

// Whenever SearchParams change, mirror them to sessionStorage
watch(
  SearchParams,
  (val) => {
    try {
      // Create a shallow plain object copy
      const plain: Record<string, string | string[]> = {};
      for (const [k, v] of Object.entries(val)) {
        // Only persist primitive or array values (skip nulls)
        if (typeof v === 'string') {
          plain[k] = v;
        } else if (Array.isArray(v)) {
          // Cast is safe because useUrlSearchParams yields string[] for array params
          plain[k] = v as unknown as string[];
        }
      }
      storedSearchParams.value = plain;
    } catch {
      // ignore storage errors
    }
  },
  { deep: true, }
)


const searchQuery = computed<string>({
  get: () => {
    const val = SearchParams[UrlParams.query];
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.join(" ");
    return "";
  },
  set: (newValue) => {
    SearchParams[UrlParams.query] = newValue;
  },
});

const view = computed<"list" | "grid">({
  get: () => {
    const val = SearchParams[UrlParams.view];
    if (val === "grid" || val === "list") return val;
    if (Array.isArray(val)) {
      const first = val.find(v => v === "grid" || v === "list");
      return (first as "grid" | "list") ?? "list";
    }
    return "list";
  },
  set: (newValue) => {
    SearchParams[UrlParams.view] = newValue;
  },
})

const requestBody = computed(() => {

  let _query: AbstractQuery;
  if (view.value === "grid") {
    _query = {
      "type": "AndQuery",
      "queries": [
        {
          "type": "FieldQuery",
          "operator": "notEmpty",
          "field": "media.rows.name",
          "value": "true",
        },
        {"type": "FullTextQuery", "query": searchQuery.value,}],
    }
  } else {
    _query = {
      type: "FullTextQuery",
      query: searchQuery.value,
    }
  }


  return {
    query: _query,
    facets: [{
      name: "hasMedia",
      field: "hasMedia",
    }],
    pagination: {
      page: 1,
      perPage: 60,
    },
  };
});

const {data, isFetching, execute, onFetchResponse,} = useFetch(
  `${props.apiUrl}/search/records?lang=${lang}`,
  {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
  {
    immediate: false,
    refetch: false,
  }
).post(requestBody).json<{
  total: number;
  rows: RecordItem[];
  facets: Record<string, Facet[]>;
}>();

onFetchResponse(_ => {
  void getIiifLink();
})

watch(
  SearchParams,
  () => execute(),
  {immediate: true,}
);

const recordImages = reactive<Record<string, string>>({});

const total = computed<number>(() => data.value?.total ?? 0);
const totalMedia = computed<number>(() => {
  return data.value?.facets?.hasMedia?.find((f: Facet) => f.value === "true")?.count ?? 0;
});

interface MediaItem {
  id: string;
  iiif: string;
  order: number;
  default: boolean;
}

interface RecordItem {
  id: string;
  title: string;
  description: string;
  media: null | { rows: MediaItem[], hasMoreMedia: boolean };
}

const records = computed<RecordItem[]>(() => data.value?.rows ?? []);

async function getIiifLink() {
  interface IiifInfo { id: string }
  for (const record1 of records.value) {

    if (!record1.media) return;
    const media = record1.media.rows.find(m => m.default);
    if (!media) return;

    const resp = await fetch(media.iiif);
    const response = (await resp.json()) as unknown as IiifInfo;

    recordImages[record1.id] = `${response.id}/full/^!360,360/0/default.jpg`;
  }
}

function getDetailUrl(uid: string): string {
  return props.detailUrl.replace(":uid", uid);
}
</script>

<template>
  <div class="container">
    <div class="row mb-2">
      <div class="col-9 mx-auto">
        <ElementsInput class="w-100" :model-value="searchQuery" @submit="(value) => {searchQuery = value}"/>
      </div>
    </div>
    <div class="row"><div class="col">
      <slot name="search-tips"/>
    </div></div>
    <!-- Hello world example using i18n composable placed below the slot -->
    <div class="row">
      <div class="col">
        <small data-test="hello-example">{{ t('hello') }}</small>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <ElementsTabs
          v-model="view"
          :tabs="{list: `${t('tabs.all')} (${n(total)})`, grid: `${t('tabs.media')} (${n(totalMedia)})`}">
          <template #list>
            <div v-if="isFetching" class="spinner-border text-primary" role="status">
              <span class="visually-hidden">{{ t('loading') }}</span>
            </div>
            <div v-else class="row">
              <div v-for="record in records" :key="record.id" class="col-12">
                <div class="card mb-3">
                  <div class="row g-0">
                    <div class="col-4">
                      <template v-if="recordImages[record.id]">
                        <img :src="recordImages[record.id]" class="img-fluid h-100 rounded-start object-fit-cover" alt="" />
                      </template>
                      <template v-else>
                        <div class="d-flex align-items-center justify-content-center bg-light rounded-start placeholder-tile">
                          <span class="material-symbols-sharp text-secondary placeholder-icon" aria-hidden="true">draft</span>
                        </div>
                      </template>
                    </div>
                    <div class="col-8">
                      <div class="card-body">
                        <h5 class="card-title">{{ record.title }}</h5>
                        <p class="card-text">{{ record.description }}</p>
                        <a :href="getDetailUrl(record.id)" class="btn btn-primary">{{ t('moreDetails') }}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template #grid>
            <div v-if="isFetching" class="spinner-border text-primary" role="status">
              <span class="visually-hidden">{{ t('loading') }}</span>
            </div>
            <div v-else class="row">
              <div v-for="record in records" :key="record.id" class="col-6 col-md-3 col-sm-4 ">
                <div class="card mb-2">
                  <template v-if="recordImages[record.id]">
                    <img
                      width="180px" height="180px" :src="recordImages[record.id]" class="object-fit-cover card-img-top"
                      alt=""
                      role="presentation"/>
                  </template>
                  <template v-else>
                    <div class="d-flex align-items-center justify-content-center bg-light card-img-top placeholder-grid">
                      <span class="material-symbols-sharp text-secondary placeholder-icon" aria-hidden="true">draft</span>
                    </div>
                  </template>
                  <div class="card-body">
                    <h5 class="card-title">{{ record.title }}</h5>
                    <p class="card-text">{{ record.description }}</p>
                    <a :href="getDetailUrl(record.id)" class="btn btn-primary">{{ t('moreDetails') }}</a>
                  </div>
                </div>


              </div>
            </div>
          </template>
        </ElementsTabs>
      </div>
    </div>
  </div>

</template>

<style scoped>
.placeholder-tile {
  width: 100%;
  height: 100%;
  min-height: 100px;
}
.placeholder-grid {
  width: 100%;
  height: 180px;
}
.placeholder-icon {
  font-size: 48px;
  line-height: 1;
}
</style>