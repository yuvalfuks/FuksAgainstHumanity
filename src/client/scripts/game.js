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
            packToImport: ""
        },
        mounted: async function() {
            this.refresh();
            setInterval(this.refresh, 200);
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
                this.Game = await $.getJSON('/api/game');
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
                    for (const pack of chosenPacks) {
                        await $.post(`/api/pack/${pack}`);
                    }
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
                res = await $.post('/api/winner', {
                    nickname: play.nickname,
                });
                this.refresh();
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
            }
        }
    })

    app.refresh()
})