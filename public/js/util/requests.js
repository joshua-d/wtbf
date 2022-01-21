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
                    status: 'failure',
                    request_error: true,
                    code: err.status
                };
            });
}

function rooms_request(sub_url, method='GET', data=null) {
    return request('/rooms/' + sub_url, method, data);
}

function game_request(sub_url, method='GET', data=null) {
    return request('/game/' + sub_url, method, data);
}

function successful(response) {
    return response.status === 'success';
}

function request_error(response) {
    return response.request_error;
}