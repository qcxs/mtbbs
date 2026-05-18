const app = Vue.createApp({
    template: `
    <div id="app-root">
      <el-container>
        <el-header class="app-header">
          <div class="header-inner">
            <div class="header-brand">MT 转换工具</div>
            <el-menu
              mode="horizontal"
              router
              :default-active="currentRoute"
              class="header-menu"
            >
              <el-menu-item
                v-for="item in menuItems"
                :key="item.path"
                :index="item.path"
              >
                {{ item.label }}
              </el-menu-item>
            </el-menu>
          </div>
        </el-header>

        <el-main class="app-main">
          <router-view ref="currentView" />
        </el-main>

        <el-footer class="app-footer-wrap">
          <app-footer />
        </el-footer>
      </el-container>
    </div>
    `,

    components: {
        AppFooter
    },

    computed: {
        menuItems() {
            return this.$router.getRoutes()
                .filter(r => r.meta && r.meta.title)
                .map(r => ({
                    path: r.path,
                    label: r.meta.title
                }));
        },
        currentRoute() {
            return this.$router.currentRoute.value.path;
        }
    },

    mounted() {
        // 将应用实例暴露给全局，以便外部脚本调用
        window.vueApp = this;
    }
});

app.use(ElementPlus);
app.use(router);
app.mount('#app');
