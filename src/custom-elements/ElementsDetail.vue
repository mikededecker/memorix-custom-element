<script setup lang="ts">

import rdfFetch from "@rdfjs/fetch";
import formats from "@rdfjs/formats-common";
import {useSessionStorage} from "@vueuse/core";
import clownface from "clownface";
import rdf from "rdf-ext";
import {computed, ref, watch} from "vue";

import {SessionKeys} from "@/types/Url.types.ts";

type DatasetExt = ReturnType<typeof rdf.dataset>;

interface Props {
  recordId: string;
  apiUrl: string;
  searchUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  searchUrl: '/',
});

const title = ref("");

// Read stored search params from sessionStorage set on SearchAll page
const storedSearchParams = useSessionStorage<Record<string, string | string[]>>(
  SessionKeys.searchParams,
  {}
);

const backLink = computed<string | null>(() => {
  const stored = storedSearchParams.value ?? {};
  const entries = Object.entries(stored);
  if (entries.length === 0) return null;

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    }
  }
  const query = params.toString();
  if (!query) return null;
  return `${props.searchUrl}#?${query}`;
});

async function fetchData(id: string): Promise<DatasetExt> {
  const url = `${props.apiUrl}/resources/records/${id}`;

  const res = await rdfFetch(url, {
    factory: rdf,
    formats,
    headers: {
      accept: "text/turtle",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch RDF resource: ${res.status} ${res.statusText}`);
  }

  const quadStream = await res.quadStream();
  const dataset = await rdf.dataset().import(quadStream);

  const cf = clownface({ dataset, });

  const rdfType = rdf.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
  const recordClass = rdf.namedNode("http://memorix.io/ontology#Record");
  const titleNamedNode = rdf.namedNode("https://www.ica.org/standards/RiC/ontology#title");
  const node = cf.has(rdfType, recordClass);

  if (!node.terms.length) throw new Error("No matching record found");
  title.value = node.out(titleNamedNode).value as string;
  return dataset;
}

// Trigger fetching when id changes; intentionally not storing the result yet
watch(
  () => props.recordId,
  async (newValue) => {
    if (!newValue) return;
    try {
      await fetchData(String(newValue));
    } catch (e) {
      // Log error in a cross-platform safe way
      globalThis.console?.error?.(String(e));
    }
  },
  { immediate: true, }
);
</script>

<template>
  <a v-if="backLink" :href="backLink">Back to results</a>
  <h1>{{title}}</h1>
</template>

<style scoped>

</style>