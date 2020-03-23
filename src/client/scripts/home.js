$().ready(() => {
    var app = new Vue({
        el: '#app',
        data: {
            message: 'Hello Vue!'
        },
        methods: {
            async submit() {
                const name = $('input').val();
                if (name.replace(/^\s+|\s+$/g, '') == '') {
                    $('body').toast({
                        position: 'bottom right',
                        class: 'warning',
                        message: `Cannot enter a black nickname`
                    });
                    return;
                }
                let response = await $.post('/api/login', {
                    nickname: name
                })
                if (response == 'bad') {
                    $('.ui.basic.modal').modal('show')
                } else {
                    window.localStorage.setItem('nickname', name)
                    console.log(window.localStorage.getItem('nickname'))
                    window.location.href += 'game'
                }
            },
            close() {
                $('.ui.basic.modal').modal('hide')
                $('input').val('');
            }

        }
    })
})