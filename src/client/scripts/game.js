$().ready(() => {

    var app = new Vue({
        el: '#app',
        data: {
            Game: {},
            myUser: {},
            myNickname: window.localStorage.getItem('nickname')
        },
        methods: {
            async refresh() {
                this.Game = await $.getJSON('/users')
                this.myUser = this.Game.users.find(user => {
                    return user.nickname == this.myNickname
                })
            },
            async ready() {
                if (this.myUser.ready) {
                    return;
                }

                let response = await $.post('/ready', {
                    nickname: this.myNickname
                })
                this.refresh()
                console.log(response)
            },
            decideCardAppearance(card) {
                let base = 'ui button call card segment'
                if (this.myUser.chosenCard) {
                    base += ' disabled';
                    if (this.myUser.chosenCard.id == card.id) {
                        base += ' primary';
                    }
                }
                if (this.Game.users[this.Game.cardCzar].nickname == this.myNickname) {
                    base += ' disabled';
                }
                return base
            },
            async chooseCard(card) {
                res = await $.post('/card', {
                    id: card.id,
                    nickname: this.myNickname
                });
                this.refresh()
            }
        }
    })

    app.refresh()
})