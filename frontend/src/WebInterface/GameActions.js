import reqs from "./requests";

async function request_locations() {
    let locs = await reqs.request('/game/locations');
    return locs
}


export default {
    request_locations
}