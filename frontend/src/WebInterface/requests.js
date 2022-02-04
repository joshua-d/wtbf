import $ from 'jquery'

function request(url, method='GET', data=null) {
    let options = {
        url: url,
        method: method
    };
    if (data != null)
        options.data = data;

    return $.ajax(options)
            .catch(function(err) {
                return {
                    status: 'error',
                    code: err.status
                };
            });
}

function successful(response) {
    return response.status === 'success';
}

export default {
    request,
    successful
}