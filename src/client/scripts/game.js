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
            packToImport: "WZANW" // testing
        },
        mounted: async function() {
            this.refresh();
            setInterval(this.refresh, 200);

            this.packs = await $.getJSON('/api/packs')
            console.log(this.packs)
            $('#chosenPacks')
                .dropdown({
                    direction: 'downward'
                });
        },
        methods: {
            isCardCzar(nickname) {
                return this.Game.users[this.Game.cardCzar].nickname == nickname
            },
            isGameLeader(nickname) {
                if (!this.Game.users)
                    return false;
                return this.Game.users[0].nickname == nickname
            },
            async refresh() {
                console.log('refreshing...')
                this.Game = await $.getJSON('/api/game')
                this.myUser = this.Game.users.find(user => {
                    return user.nickname == this.myNickname
                })
            },
            async ready() {
                if (this.isReady) {
                    return;
                }
                this.isReady = true;
                if (this.isGameLeader(this.myNickname)) {
                    const chosenPacks = $('#chosenPacks').dropdown('get value');
                    if (chosenPacks.length == 0) {
                        $('#packMenu')
                            .toast({
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

                let response = await $.post('/api/ready', {
                    nickname: this.myNickname
                })
                this.refresh()
            },
            decideCardAppearance(card) {
                let base = 'ui button call card segment'
                if (this.myUser.chosenCard) {
                    base += ' disabled';
                    if (this.myUser.chosenCard.id == card.id) {
                        base += ' primary';
                    }
                }
                if (this.isCardCzar(this.myNickname)) {
                    base += ' disabled';
                }
                return base
            },
            decideUserAppearance(user) {
                if (this.Game.inProgress) {
                    Ready = this.isCardCzar(user.nickname) || user.chosenCard
                } else {
                    Ready = user.ready
                }
                return Ready ? '' : 'notReady'

            },
            async chooseCard(card) {
                res = await $.post('/api/card', {
                    id: card.id,
                    nickname: this.myNickname
                });
                this.refresh()
            },
            async chooseWinner(play) {
                res = await $.post('/api/winner', {
                    nickname: play.nickname,
                });
                this.refresh()
            },
            async addPack() {
                this.loadingCardPack = true;
                if (this.packToImport) {
                    let response = await $.get(`/api/pack/${this.packToImport}`)
                    if (response == 'ok') {
                        this.packToImport = '';
                        this.packs = await $.getJSON('/api/packs')
                        this.loadingCardPack = false;
                        console.log('success')
                        return
                    }
                }
                this.packToImport = '';
                this.loadingCardPack = false;
                console.log('fail')
                $('#packMenu')
                    .toast({
                        position: 'bottom right',
                        class: 'error',
                        message: 'Failed finding the pack!'
                    });

                // TODO
            }
        }
    })

    app.refresh()
})