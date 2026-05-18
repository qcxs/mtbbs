const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: '/', redirect: '/md-to-bbcode' },
        {
            path: '/md-to-bbcode',
            component: MdToBbcode,
            meta: { title: 'Markdown → BBCode', icon: 'Document' }
        },
        {
            path: '/bbcode-to-html',
            component: BbcodeToHtml,
            meta: { title: 'BBCode → HTML', icon: 'View' }
        }
    ]
});
