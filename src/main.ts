import {defineCustomElement} from "vue";
import 'material-symbols/sharp.css'
import 'bootstrap/scss/bootstrap.scss'

import SearchAllDetail from "./custom-elements/ElementsDetail.vue";
import SearchAll from "./custom-elements/SearchAll.vue";

customElements.define('memorix-search-all', defineCustomElement(SearchAll, {
  shadowRoot: false,
}))

customElements.define('memorix-search-detail', defineCustomElement(SearchAllDetail, {
  shadowRoot: false,
}))