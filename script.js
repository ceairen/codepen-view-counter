// ==UserScript==
// @name         Codepen View Counter
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://codepen.io/*/pens/popular
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const ID_NUMBER_VIEWS = "number_views_id";
    const wait_for_profile_apparition = (params) => {
        new MutationObserver(function(mutations) {
            var el = document.querySelector(params.elt);
            if (el) {
                this.disconnect();
                params.done(el);
            }
        }).observe(params.parent || document, {
            subtree: !!params.recursive || !params.parent,
            childList: true,
        });
    }
    const profile_counter_views = () => {
        const counter_views = document.createElement('div');
        const counter_views_a = document.createElement('a');
        const counter_views_strong = document.createElement('strong');
        const counter_views_span = document.createElement('span');
        counter_views_a.classList.add('follow-block');
        counter_views_span.innerText = "Views";
        counter_views_strong.innerText = "0";
        counter_views_strong.setAttribute('id', ID_NUMBER_VIEWS);
        counter_views_strong.style.marginRight = `${3}px`;
        counter_views_a.appendChild(counter_views_strong);
        counter_views_a.appendChild(counter_views_span);
        counter_views.appendChild(counter_views_a);
        return counter_views;
    }
    const init_counter_views = () => {
        document.querySelector('.profile-header-right').appendChild(profile_counter_views());
        refresh_counter_views();
    }
    const refresh_counter_views = () => {
        let paginate_button_list = Array.prototype.slice.call(document.querySelectorAll('.react-pagination-button'));
        update_counter_views((value) => {
            dom_update_counter_views(value);
            paginate_button_list.forEach((button) => {
                if(button.innerText.toString().toLowerCase().includes('next')) {
                    button.click();
                    wait_for_profile_apparition({
                        elt: '.item-in-list-view',
                        parent: null,
                        recursive: false,
                        done: (el) => refresh_counter_views()
                    });
                }else{

                }
            })
        });
    }
    const update_counter_views = (callback) => {
        const stat_values = Array.prototype.slice.call(document.querySelectorAll('.stat-value')).reduce((acc, cur) => {
            if(cur.getAttribute('title').toString().toLowerCase().includes('views')) {
                acc += parseInt(cur.innerText.replace(/\s/g, ''));
            }
            return acc;
        }, 0)
        callback(stat_values);
    }
    const dom_update_counter_views = (nbViews) => {
        let views_value = parseInt(document.getElementById(ID_NUMBER_VIEWS).innerText);
        document.getElementById(ID_NUMBER_VIEWS).innerText = views_value + nbViews;
    }
    wait_for_profile_apparition({
        elt: '.item-in-list-view',
        parent: null,
        recursive: false,
        done: (el) => init_counter_views(el)
    });
})();