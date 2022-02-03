import reqs from "./requests";

class Checker {
    /* interval_fn must return a Promise
    *  on_response must return whether or not the interval should stop */
    constructor(interval_fn, args, on_response) {
        this.interval_fn = interval_fn;
        this.args = args;
        this.on_response = on_response;
        this.interval = null;
    }

    /* Checks once. Returns true if should stop, false if shouldn't, null if error. */
    async check() {
        let res = await this.interval_fn(this.args);
        if (reqs.successful(res)) {
            return this.on_response(res);
        }
        console.log('Checkers: unsuccessful response');
        return null;
    }

    /* Checks in 1 second intervals. Stops on error or on_response returning true. */
    _run() {
        let checker = this;
        let promise_done = true;

        this.interval = setInterval(function() {
            if (promise_done) {
                checker.interval_fn(this.args)
                    .then(function(res) {
                        if (!reqs.successful(res)) {
                            clearInterval(checker.interval);
                            promise_done = true;
                            console.log('Checkers: unsuccessful response, stopping');
                        }
                        else {
                            let should_stop = checker.on_response(res);
                            if (should_stop)
                                clearInterval(checker.interval);
                            promise_done = true;
                        }
                    });
            }
        }, 1000);
    }

    /* Checks once, then if check should not stop, keeps checking. */
    async start() {
        let should_stop = await this.check();
        if (should_stop === false)
            this._run();
    }

    /* Stops checking. */
    stop() {
        clearInterval(this.interval);
    }
}

class IsGameStartedChecker extends Checker {
    constructor(conn_id, callback) {
        super(function(conn_id) {
            return reqs.request(`/game/is-game-started?conn_id=${conn_id}`);
        },
        conn_id,
        callback);
    }
}



export {
    IsGameStartedChecker
}