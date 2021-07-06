// ==UserScript==
// @name         Codepen View Counter V2
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  try to take over the world!
// @author       You
// @match        https://codepen.io/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const ID_CPC_VIEW = "cpc_view";
    const ID_CPC_VIEW_STATS = "cpc_view_stats";
    const CLASS_PROFILE_HEADER = "profile-header-right";

    const KEY_NUMBER_VIEWS = "CVC_KEY_NUMBER_VIEWS";
    const TEMP_KEY_NUMBER_VIEWS = "CVC_TEMP_KEY_NUMBER_VIEWS";

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    const $$$ = (selector) => Array.prototype.slice.call(selector);

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
        counter_see_infos_button.innerText = "Hide stats";
        counter_see_infos_button.style.cssText = `${cssStyleForViews} background-color: #2c303a;`;
        let statsHidden = false;
        counter_see_infos_button.addEventListener('click', () => {
            const statsBlock = $(`#${ID_CPC_VIEW_STATS}`);
            statsBlock.style.display = !statsHidden ? 'none' : 'block';
            statsHidden = !statsHidden;
            counter_see_infos_button.innerText = !statsHidden ? "Hide stats" : "Show stats"
        }, false);
        const counter_view_stats = document.createElement('div');
        counter_view_stats.setAttribute('id', ID_CPC_VIEW_STATS);
        counter_view_stats.style.cssText = `
            position: absolute;
            background-color: #2c303a;
            text-align: left;
            top: 50px;
            border-radius: 3px;
            -webkit-box-shadow: 5px 5px 15px 0px #000000;
            box-shadow: 5px 5px 15px 0px #000000;
            z-index: 9999;
        `;

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

        // title part
        const counter_view_stats_title = document.createElement('div');
        const counter_view_stats_title_title = document.createElement('label');
        counter_view_stats_title_title.innerText = "Statistiques";
        counter_view_stats_title.appendChild(counter_view_stats_title_title);
        counter_view_stats_title.style.cssText = cssSyleForChilds;
        counter_view_stats.appendChild(counter_view_stats_title);

        // view part
        const counter_view_stats_views = document.createElement('div');
        counter_view_stats_views.setAttribute('id', `${ID_CPC_VIEW_STATS}_views`);
        counter_view_stats_views.style.cssText = cssSyleForChilds;
        const counter_view_stats_views_span = document.createElement('span');
        const counter_view_stats_views_label = document.createElement('label');
        counter_view_stats_views_span.innerText = 'Views';
        counter_view_stats_views_span.style.cssText = cssSyleForSpanChilds;
        counter_view_stats_views.appendChild(counter_view_stats_views_span);
        counter_view_stats_views.appendChild(counter_view_stats_views_label);
        counter_view_stats.appendChild(counter_view_stats_views);

        //love part
        const counter_view_stats_love = document.createElement('div');
        counter_view_stats_love.setAttribute('id', `${ID_CPC_VIEW_STATS}_loves`);
        counter_view_stats_love.style.cssText = cssSyleForChilds;
        const counter_view_stats_love_span = document.createElement('span');
        const counter_view_stats_love_label = document.createElement('label');
        counter_view_stats_love_span.innerText = 'Loves';
        counter_view_stats_love_span.style.cssText = cssSyleForSpanChilds;
        counter_view_stats_love.appendChild(counter_view_stats_love_span);
        counter_view_stats_love.appendChild(counter_view_stats_love_label);
        counter_view_stats.appendChild(counter_view_stats_love);


        //comment part
        const counter_view_stats_comment = document.createElement('div');
        counter_view_stats_comment.setAttribute('id', `${ID_CPC_VIEW_STATS}_comments`);
        counter_view_stats_comment.style.cssText = cssSyleForChilds;
        const counter_view_stats_comment_span = document.createElement('span');
        const counter_view_stats_comment_label = document.createElement('label');
        counter_view_stats_comment_span.innerText = 'Comments';
        counter_view_stats_comment_span.style.cssText = cssSyleForSpanChilds;
        counter_view_stats_comment.appendChild(counter_view_stats_comment_span);
        counter_view_stats_comment.appendChild(counter_view_stats_comment_label);
        counter_view_stats.appendChild(counter_view_stats_comment);

        //refresh part
        const counter_view_stats_refresh = document.createElement('div');
        counter_view_stats_refresh.setAttribute('id', `${ID_CPC_VIEW_STATS}_refresh`);
        counter_view_stats_refresh.style.cssText = cssSyleForChilds;
        const counter_view_stats_refresh_span = document.createElement('span');
        const counter_view_stats_refresh_label = document.createElement('label');
        counter_view_stats_refresh_span.innerText = 'Last refresh';
        counter_view_stats_refresh_span.style.cssText = cssSyleForSpanChilds;
        counter_view_stats_refresh.appendChild(counter_view_stats_refresh_span);
        counter_view_stats_refresh.appendChild(counter_view_stats_refresh_label);
        counter_view_stats.appendChild(counter_view_stats_refresh);

        counter_views.appendChild(counter_view_stats);
        counter_views.appendChild(counter_see_infos_button);
        counter_views.appendChild(counter_refresh_views_button);
        return counter_views;
    }

    // UPDATE LA VUE STATISTIQUE
    const updateCounterView = () => {
        let savedInformations = localStorage.getItem(KEY_NUMBER_VIEWS);
        let informations = {
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
                let p_views = 0;
                let p_loves = 0;
                let p_comms = 0;
                userInformations.datas.forEach((data) => {
                    p_views += data.views;
                    p_loves += data.loves;
                    p_comms += data.comments;
                });
                informations = {
                    views: addNumberSeparator(p_views),
                    loves: addNumberSeparator(p_loves),
                    comments: addNumberSeparator(p_comms),
                    lastRefresh: userInformations.lastRefresh
                }
            }
        }

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
            done: () => {
                launchScanPage();
            }
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
