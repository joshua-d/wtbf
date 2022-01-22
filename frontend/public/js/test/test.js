/*
(function() {
    let obj = {};
    sk(obj);
    $(function() {
        $('#click-p').click(obj.func);
    });
})();
*/

let obj = {};
obj.my_var = my_var;
sk(obj);
obj.func();

var my_var = 10;

function sk(obj) {
    let socket = 42;
    function get_socket() {
        console.log(socket);
    }
    obj.func = get_socket;
}


