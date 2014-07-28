// WebSocket Client
function WSClient() {
    this.host = 'localhost';
    this.port = 8888;
    this.uri = '/ws';
    this.ws = null;
    this.connection = false;
}

WSClient.prototype.sendMessage = function(command, data) {
    if (!data) {
        data = null;
    }
    var message = {'command': command, 'data': data};
    this.ws.send(JSON.stringify(message));
};

WSClient.prototype.connect = function() {
    if (!this.ws) {
        this.ws = new WebSocket('ws://' + this.host + ':' + this.port + this.uri);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }
};

WSClient.prototype.disconnect = function() {
    if (this.ws) {
        this.ws.close();
    }
};

WSClient.prototype.onOpen = function() {
    console.log('Соединение открыто');
    this.connection = true;
};

WSClient.prototype.onClose = function(event) {
    if (event.wasClean) {
        console.log('Соединение закрыто чисто');
    } else {
        console.log('Обрыв соединения'); // например, "убит" процесс сервера
    }
    console.log('Код: ' + event.code + ' причина: ' + event.reason);
    this.ws = null;
    this.connection = false;
};

WSClient.prototype.onError = function(error) {
    console.log('Ошибка ' + error.message);
};

WSClient.prototype.onMessage = function(event) {

};

WSClient.prototype.isConnected = function() {
    return this.connection;
};

function Chat(input_id, chat_field_id, btn_send_id){
    this.name = prompt("Введите имя");
    this.client = new WSClient();
    //this.client.connect();
    this.input = document.getElementById(input_id);
    this.output = document.getElementById(chat_field_id);
    this.btn_send = document.getElementById(btn_send_id);
    this.btn_send.onclick = function (e) {
        var data = this.input.value;
        this.client.sendMessage('message_send', data);
        this.input.value = '';
    }.bind(this);
    this.client.onMessage = function(event){
        var m = JSON.parse(event.data);
        console.log(event.data);
        switch(m['message']) {
            case 'messages':
                this.output.value = m['data'];
                break;
            case 'open':
                this.output.value = m['data'];
                this.client.sendMessage('auth', this.name);
                break;
        }
    }.bind(this);
}