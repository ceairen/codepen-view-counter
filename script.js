(function() {
    'use strict';

    const ID_CPC_VIEW = "cpc_view";
    const ID_CPC_VIEW_STATS = "cpc_view_stats";
    const ID_CPC_VIEW_FULL_STATS = "cpc_view_full_stats";
    const ID_CPC_BOARD_CONTENT = "cpc_board_content";
    const CLASS_PROFILE_HEADER = "profile-header-right";
    const BUTTON_STATS = "btn_stats";
    const BUTTON_STATS_FULL = "btn_stats_full";

    const KEY_NUMBER_VIEWS = "CVC_KEY_NUMBER_VIEWS";
    const SAVED_STATS = "CVC_SAVED_STATS";
    const TEMP_KEY_NUMBER_VIEWS = "CVC_TEMP_KEY_NUMBER_VIEWS";

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    const $$$ = (selector) => Array.from(selector);

    let statsHidden = false;
    let statsHiddenFull = true;

    Date.prototype.frenchFormat = function() {
        var mm = this.getMonth() + 1;
        var dd = this.getDate();
        var hh = this.getHours();
        var mmm = this.getMinutes();

        const date = [(dd>9 ? '' : '0') + dd,
                (mm>9 ? '' : '0') + mm,
                this.getFullYear()
               ]
        .join('/');

        const hour = [(hh>9 ? '' : '0') + hh,
                (mmm>9 ? '' : '0') + mmm
               ]
        .join(':');

        const fullDate = `${date} à ${hour}`;

        return fullDate;
    };

    const addNumberSeparator = (a, b) => {
        a = '' + a;
        b = b || ' ';
        var c = '',
            d = 0;
        while (a.match(/^0[0-9]/)) {
            a = a.substr(1);
        }
        for (var i = a.length-1; i >= 0; i--) {
            c = (d != 0 && d % 3 == 0) ? a[i] + b + c : a[i] + c;
            d++;
        }
        return c;
    }

    // ATTEND LE CHARGEMENT DES ELEMENTS DE LA TABLE
    const waitingForLoad = (params) => {
        new MutationObserver(function(mutations) {
            var el = $(params.elt);
            if (el) {
                this.disconnect();
                params.done();
            }
        }).observe(params.parent || document, {
            subtree: !!params.recursive || !params.parent,
            childList: true,
        });
    }

    // RECUPERE LE USER COURANT
    const getCurrentUserPage = () => { return $('#profile-username').innerText ?? null; }

    // RECUPERE LE BOUTON NEXT
    const getNextButton = () => {
        let nextButton = null;
        const buttons = $$$($$('button'));
        buttons.forEach(btn => {
            const direction = btn.getAttribute('data-direction');
            if(direction !== null && direction === 'next') {
                nextButton = btn;
            }
        })
        return nextButton;
    }

    // INIT LE SCAN
    const launchWindowScan = () => {
        const user = getCurrentUserPage() !== null ? getCurrentUserPage().toString().replace('@', '') : null;
        if(user === null) { return; }
        let url = `http://www.codepen.io/${user}/pens/popular#scanviews`;
        let win = window.open(url, "MyDialog", 10, 10, "menubar=0,toolbar=0");
        win.onbeforeunload = () => {
            updateCounterView();
        }
    }

    // CREER LA VUE LOADING
    const createLoadingView = () => {
        const loading_view = document.createElement('div');
        const loading_text = document.createElement('h1');
        loading_text.innerText = "Calcul des statistiques";
        loading_text.setAttribute('id', 'loadingh1');
        loading_view.style.cssText = "position: fixed; z-index: 9999999; left: 0; top: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, .9); display: flex; justify-content: center; align-items: center;";
        loading_view.appendChild(loading_text);
        document.body.appendChild(loading_view);
    }

    const createViewCounterSubviewDom = (subview_name, subview_title) => {
        const cssSyleForChilds = `
            padding: 5px 8px;
            min-width: 150px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        const cssSyleForSpanChilds = `
            color: #868ca0;
            margin-right: 20px;
            font-size: 13px;
        `;
        const counter_view_stats_subview = document.createElement('div');
        counter_view_stats_subview.setAttribute('id', `${ID_CPC_VIEW_STATS}_${subview_name}`);
        counter_view_stats_subview.style.cssText = cssSyleForChilds;
        const counter_view_stats_subview_span = document.createElement('span');
        const counter_view_stats_subview_label = document.createElement('label');
        counter_view_stats_subview_span.innerText = subview_title;
        counter_view_stats_subview_span.style.cssText = cssSyleForSpanChilds;
        counter_view_stats_subview.appendChild(counter_view_stats_subview_span);
        counter_view_stats_subview.appendChild(counter_view_stats_subview_label);
        return counter_view_stats_subview;
    }

    const createBoardDom = () => {
        const board = document.createElement('div');
        const boardTitle = document.createElement('h2');
        boardTitle.innerText = 'Statistiques Globales';
        boardTitle.style.cssText = 'text-align: center; margin: 10px;';
        const boardContent = document.createElement('div');
        boardContent.innerText = 'Rien pour le moment.';
        boardContent.setAttribute('id', ID_CPC_BOARD_CONTENT);
        boardContent.style.cssText = `
             height: calc(100vh - 46px);
             overflow: auto;
        `;
        board.appendChild(boardTitle);
        board.appendChild(boardContent);
        return board;
    }

    // CREER LA VUE STATISTIQUE
    const createViewCounterDom = () => {
        const cssStyleForViews = `
             outline: none;
             cursor: pointer;
             padding: 2px 5px;
             border: none;
             border-radius: 3px;
             color: white;
             margin-right: 10px;
        `;
        const counter_views = document.createElement('div');
        counter_views.setAttribute('id', ID_CPC_VIEW);
        const counter_refresh_views_button = document.createElement('button');
        counter_refresh_views_button.innerText = "Refresh";
        counter_refresh_views_button.style.cssText = `${cssStyleForViews} background-color: #868ca0;`;
        counter_refresh_views_button.addEventListener('click', launchWindowScan, false);
        counter_views.appendChild(counter_refresh_views_button);
        const counter_see_infos_button = document.createElement('button');
        counter_see_infos_button.setAttribute('id', BUTTON_STATS);
        counter_see_infos_button.innerText = "Toggle stats";
        counter_see_infos_button.style.cssText = `${cssStyleForViews} background-color: #2c303a;`;
        const counter_full_infos_button = document.createElement('button');
        counter_full_infos_button.setAttribute('id', BUTTON_STATS_FULL);
        counter_full_infos_button.innerText = "Toggle board";
        counter_full_infos_button.style.cssText = `${cssStyleForViews} background-color: #2c303a;`;
        counter_see_infos_button.addEventListener('click', () => {
            toggleStatView()
        }, false);
        counter_full_infos_button.addEventListener('click', () => {
            toggleStatView(true)
        }, false);
        const commonViewCss = `
            background-color: #2c303a;
            border-radius: 3px;
            -webkit-box-shadow: 5px 5px 15px 0px #000000;
            box-shadow: 5px 5px 15px 0px #000000;
            text-align: left;
        `;
        const counter_full_stats = document.createElement('div');
        counter_full_stats.setAttribute('id', ID_CPC_VIEW_FULL_STATS);
        counter_full_stats.style.cssText = commonViewCss + `
            position: fixed;
            top: 0px;
            right: 0px;
            bottom: 0px;
            min-width: 300px;
            border-radius: 3px;
            z-index: 99999;
        `;
        counter_full_stats.style.display = 'none';
        counter_full_stats.appendChild(createBoardDom());
        const counter_view_stats = document.createElement('div');
        counter_view_stats.setAttribute('id', ID_CPC_VIEW_STATS);
        counter_view_stats.style.cssText = commonViewCss + `
            position: absolute;
            top: 50px;
            border-radius: 3px;
            z-index: 9999;
        `;

        // title part
        counter_view_stats.appendChild(createViewCounterSubviewDom('totalpens', 'Total pens'));

        // view part
        counter_view_stats.appendChild(createViewCounterSubviewDom('views', 'Views'));

        //love part
        counter_view_stats.appendChild(createViewCounterSubviewDom('loves', 'Loves'));

        //comment part
        counter_view_stats.appendChild(createViewCounterSubviewDom('comments', 'Comments'));

        //refresh part
        counter_view_stats.appendChild(createViewCounterSubviewDom('refresh', 'Last refresh'));

        counter_views.appendChild(counter_full_stats);
        counter_views.appendChild(counter_view_stats);
        counter_views.appendChild(counter_see_infos_button);
        counter_views.appendChild(counter_full_infos_button);
        counter_views.appendChild(counter_refresh_views_button);
        return counter_views;
    }

    const toggleStatView = (full = false) => {
        const statsBlock = $(`#${ID_CPC_VIEW_STATS}`);
        const statsBlockFull = $(`#${ID_CPC_VIEW_FULL_STATS}`);
        const buttonStats = $(`#${BUTTON_STATS}`);
        const buttonStatsFull = $(`#${BUTTON_STATS_FULL}`);
        if(statsBlock === null || buttonStats === null || buttonStatsFull === null) return;
        if(full) {
            statsBlockFull.style.display = !statsHiddenFull ? 'none' : 'block';
            statsBlock.style.display = 'none';
            statsHidden = true;
            statsHiddenFull = !statsHiddenFull;
        }else{
            statsBlock.style.display = !statsHidden ? 'none' : 'block';
            statsHidden = !statsHidden;
            statsHiddenFull = true;
            statsBlockFull.style.display = 'none';
        }
    }

    const createListPenDom = (data) => {
        const pen = document.createElement('div');
        pen.style.cssText = `
             margin: 2px 0;
             padding: 10px;
             border-bottom: 1px solid #3e3d3d;
        `;
        const penTitle = document.createElement('label');
        penTitle.innerText = data.title;
        const penStats = document.createElement('label');
        penStats.style.cssText = 'font-size: 12px; color: grey;';
        penStats.innerText = `
             Views: ${data.views}
             Loves: ${data.loves}
             Comments: ${data.comments}
        `;
        pen.appendChild(penTitle);
        pen.appendChild(penStats);
        return pen;
    }

    const updateCounterViewFull = (pen) => {
        const boardContent = $(`#${ID_CPC_BOARD_CONTENT}`);
        boardContent.appendChild(createListPenDom(pen));
    }

    // UPDATE LA VUE STATISTIQUE
    const updateCounterView = () => {
        let savedInformations = localStorage.getItem(KEY_NUMBER_VIEWS);
        let informations = {
            totalPens: '-',
            views: '-',
            loves: '-',
            comments: '-',
            lastRefresh: '-'
        };
        if(savedInformations !== null){
            savedInformations = JSON.parse(savedInformations);
            let userInformations = null;
            savedInformations.forEach((informations) => {
                if(informations.user === getCurrentUserPage()) {
                    userInformations = informations;
                }
            });
            if(userInformations !== null) {
                $(`#${ID_CPC_BOARD_CONTENT}`).innerText = '';
                let p_views = 0;
                let p_loves = 0;
                let p_comms = 0;
                userInformations.datas.forEach((data) => {
                    p_views += data.views;
                    p_loves += data.loves;
                    p_comms += data.comments;
                    updateCounterViewFull(data);
                });
                informations = {
                    totalPens: userInformations.datas.length,
                    views: addNumberSeparator(p_views),
                    loves: addNumberSeparator(p_loves),
                    comments: addNumberSeparator(p_comms),
                    lastRefresh: userInformations.lastRefresh
                }
            }
        }

        $(`#${ID_CPC_VIEW_STATS}_totalpens`).querySelector('label').innerText = informations.totalPens;
        $(`#${ID_CPC_VIEW_STATS}_views`).querySelector('label').innerText = informations.views;
        $(`#${ID_CPC_VIEW_STATS}_loves`).querySelector('label').innerText = informations.loves;
        $(`#${ID_CPC_VIEW_STATS}_comments`).querySelector('label').innerText = informations.comments;
        $(`#${ID_CPC_VIEW_STATS}_refresh`).querySelector('label').innerText = informations.lastRefresh;
    }

    // INIT LE SCRIPT DE SCAN
    const launchScanScript = () => {
        waitingForLoad({
            elt: '.item-in-list-view',
            parent: null,
            recursive: false,
            done: () => launchScanPage()
        });
    }

    // SCRIPT DE SCAN
    const scanningPage = (callback) => {
        callback($$$($$('.item-in-list-view')).reduce((acc, cur) => {
            const title = cur.querySelector('.title').getAttribute('title');
            const curListStatsBlock = $$$(cur.querySelector('.list-stats').children);
            let curListStats = {
                title: title,
                views: null,
                loves: null,
                comments: null
            }
            curListStatsBlock.forEach((stat) => {
                if(stat.getAttribute('title').toString().toLowerCase().includes('views')) {
                    curListStats.views = parseInt(stat.innerText.replace(/\s/g, ''));
                }
                if(stat.getAttribute('title').toString().toLowerCase().includes('hearts')) {
                    curListStats.loves = parseInt(stat.innerText.replace(/\s/g, ''));
                }
                if(stat.getAttribute('title').toString().toLowerCase().includes('comments')) {
                    curListStats.comments = parseInt(stat.innerText.replace(/\s/g, ''));
                }
            });
            acc.push(curListStats);
            return acc;
        }, []));
    }

    const launchScanPage = () => {
        let buttonNext = getNextButton();
        const loading_text = $('#loadingh1');
        if(loading_text){
            loading_text.innerText += '.';
        }
        scanningPage((value) => {
            let tempSavedInformations = localStorage.getItem(TEMP_KEY_NUMBER_VIEWS);
            if(tempSavedInformations !== null){
                localStorage.setItem(TEMP_KEY_NUMBER_VIEWS, JSON.stringify([...JSON.parse(tempSavedInformations), ...value]));
            }else{
                localStorage.setItem(TEMP_KEY_NUMBER_VIEWS, JSON.stringify(value));
            }
            if(buttonNext !== null) {
                buttonNext.click();
                waitingForLoad({
                    elt: '.item-in-list-view',
                    parent: null,
                    recursive: false,
                    done: (el) => launchScanPage()
                });
            }else{
                let definitiveTempSavedInformations = localStorage.getItem(TEMP_KEY_NUMBER_VIEWS);
                localStorage.removeItem(TEMP_KEY_NUMBER_VIEWS);

                var date = new Date();

                const informations = {
                    user: getCurrentUserPage(),
                    datas: JSON.parse(definitiveTempSavedInformations),
                    lastRefresh: date.frenchFormat()
                };
                let existingInformations = [];
                if(localStorage.getItem(KEY_NUMBER_VIEWS) !== null){
                    existingInformations = JSON.parse(localStorage.getItem(KEY_NUMBER_VIEWS));
                }
                let newInformations = existingInformations.reduce((acc, cur) => {
                    if(cur.user !== `${getCurrentUserPage()}`){
                        acc.push(cur);
                    }
                    return acc;
                }, []);
                newInformations.push(informations);
                localStorage.setItem(KEY_NUMBER_VIEWS, JSON.stringify(newInformations));
                window.close();
            }
        })
    }

    const initCounterView = () => {
        $(`.${CLASS_PROFILE_HEADER}`).prepend(createViewCounterDom());
        updateCounterView();
        if(window.location.search && window.location.search.includes('cursor')){
            return;
        }
        if(window.location.href.toString().indexOf('#scanviews') !== -1) {
            createLoadingView();
            launchScanScript();
        }
    }

    waitingForLoad({
        elt: `.${CLASS_PROFILE_HEADER}`,
        parent: null,
        recursive: false,
        done: () => initCounterView()
    });
})();
