$().ready(() => {

    var app = new Vue({
        el: '#app',
        data: {
            Game: {},
            myUser: {},
            myNickname: window.localStorage.getItem('nickname')
        },
        mounted: function() {
            setInterval(this.refresh, 200);
        },
        methods: {
            isCardCzar(nickname) {
                return this.Game.users[this.Game.cardCzar].nickname == nickname
            },
            async refresh() {
                console.log('refreshing...')
                this.Game = await $.getJSON('/api/game')
                this.myUser = this.Game.users.find(user => {
                    return user.nickname == this.myNickname
                })
            },
            async ready() {
                if (this.myUser.ready) {
                    return;
                }
                this.myUser.ready = true // prevent races

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
            }
        }
    })

    app.refresh()
})