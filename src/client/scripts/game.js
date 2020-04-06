"use strict ";
$().ready(() => {
    var app = new Vue({
        el: '#app',
        data: {
            Game: {},
            packs: [],
            myUser: {},
            myNickname: window.localStorage.getItem('nickname'),
            isReady: false,
            loadingCardPack: false,
            packToImport: "",
            winnerChosen: false
        },
        mounted: async function() {
            this.refresh();
            setInterval(this.refresh, 1000);
        },
        methods: {
            isCardCzar(nickname) {
                return this.Game.users[this.Game.cardCzar].nickname == nickname;
            },
            isGameLeader(nickname) {
                if (!this.Game.users)
                    return false;
                return this.Game.users[0].nickname == nickname;
            },
            async refresh() {
                const response = await $.getJSON(`/api/game/${this.myNickname}`);
                if (response.users == 'bad') {
                    $('#gameOver').modal({
                        closable: false
                    }).modal('show');
                    return;
                }

                this.Game = response;
                if (this.Game.winner) {
                    $('#winner').modal({
                        closable: false
                    }).modal('show');
                    return;
                }

                this.myUser = this.Game.users.find(user => {
                    return user.nickname == this.myNickname;
                });
                this.packs = await $.getJSON('/api/packs');
                $('#chosenPacks').dropdown({
                    direction: 'downward'
                });
            },
            async ready() {
                if (this.isReady) {
                    return;
                }
                this.isReady = true;
                if (this.isGameLeader(this.myNickname)) {
                    const chosenPacks = $('#chosenPacks').dropdown('get value');
                    if (chosenPacks.length == 0) {
                        $('#packMenu').toast({
                            position: 'bottom right',
                            class: 'error',
                            message: 'You must choose at least one card pack!'
                        });
                        this.isReady = false;
                        return;
                    }

                    $('#packMenu').hide();
                    $('#loader').addClass('ui active dimmer');
                    const promises = []
                    for (const pack of chosenPacks) {
                        promises.push($.post(`/api/pack/${pack}`));
                    }
                    await Promise.all(promises);
                    $('#loader').removeClass('ui active dimmer');
                }

                await $.post('/api/ready', {
                    nickname: this.myNickname
                });
                this.refresh()
            },
            decideCardAppearance(card) {
                let base = 'ui button call card segment';
                if (this.myUser.chosenCard) {
                    base += ' disabled';
                    if (this.myUser.chosenCard.id == card.id) {
                        base += ' primary';
                    }
                }
                if (this.isCardCzar(this.myNickname)) {
                    base += ' disabled';
                }
                return base;
            },
            decidePlayAppearance(play) {
                let base = 'ui call card segment';
                if (this.canCzarChooseWinner() && this.isCardCzar(this.myNickname)) {
                    base += ' button'
                }
                if (this.Game.recentWinner == play.nickname) {
                    base += ' winner';
                }
                return base
            },
            canCzarChooseWinner() {
                return this.isCardCzar(this.myNickname) && this.Game.playedCards.length === this.Game.users.length - 1 && !this.Game.recentWinner;
            },
            decideUserAppearance(user) {
                if (this.Game.inProgress) {
                    Ready = this.isCardCzar(user.nickname) || user.chosenCard;
                } else {
                    Ready = user.ready;
                }
                return Ready ? '' : 'notReady';
            },
            async chooseCard(card) {
                res = await $.post('/api/card', {
                    id: card.id,
                    nickname: this.myNickname
                });
                this.refresh();
            },
            async chooseWinner(play) {
                if (this.winnerChosen) return;
                if (this.Game.recentWinner) return;
                if (this.isCardCzar(this.myNickname)) {
                    this.winnerChosen = true;
                    res = await $.post('/api/winner', {
                        nickname: play.nickname,
                    });
                    this.refresh();
                    this.winnerChosen = false;
                }

            },
            async addPack() {
                this.loadingCardPack = true;
                if (this.packToImport.replace(/^\s+|\s+$/g, '')) {
                    let response = await $.get(`/api/pack/${this.packToImport}`);
                    if (response == 'ok') {
                        this.packs = await $.getJSON('/api/packs');
                        $('body').toast({
                            position: 'bottom right',
                            class: 'success',
                            message: `Successfully added pack ${this.packToImport}`
                        });
                        this.packToImport = '';
                    } else if (response == 'dup') {
                        $('body').toast({
                            position: 'bottom right',
                            class: 'warning',
                            message: 'Pack already exists!'
                        });

                    } else if (response == 'bad') {
                        $('body').toast({
                            position: 'bottom right',
                            class: 'error',
                            message: 'Failed finding the pack!'
                        });

                    }
                } else {
                    $('body').toast({
                        position: 'bottom right',
                        class: 'warning',
                        message: `Cannot import a black pack code`
                    });
                }
                this.packToImport = '';
                this.loadingCardPack = false;
            },
            close(modal) {
                $(modal).modal('hide')
                window.location.href = window.location.href.substring(0, window.location.href.length - 5);
            },
            decideTextDirection(text) {
                const ENGLISH = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
                for (let index = text.length - 1; index >= 0; --index) {
                    if (ENGLISH.indexOf(text.substring(index, index + 1)) > 0) {
                        return 'ltr';
                    }
                }
                return 'rtl';
            }
        }
    })

    app.refresh()
})