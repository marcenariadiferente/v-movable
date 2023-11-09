import component from './components/movable.vue';
import directive from './directives/movable';

export default {
  install(Vue) {
    Vue.directive("movable", directive)
    Vue.component("movable", component);
  }
};

