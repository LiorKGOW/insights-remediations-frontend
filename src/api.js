import { API_BASE } from './config';
import get from 'lodash/get';

import urijs from 'urijs';

class ApiError extends Error {
    constructor(description) {
        super('Error communicating with the server');
        this.description = description;
    }
}

async function checkResponse (r) {
    if (r.ok) {
        return r;
    }

    if (r.status === 401) {
        window.insights.chrome.auth.logout();
    }

    if (r.headers.get('content-type').includes('application/json')) {
        // let's try to extract some more info
        const data = await r.json();

        const error = get(data, 'errors[0]');

        if (error) {
            if (get(error, 'details.name')) {
                throw new ApiError(`${error.title} (${error.details.name})`);
            }

            throw new ApiError(error.title);
        }
    }

    throw new ApiError(`Unexpected response code ${r.status}`);
}

async function json (r) {
    await checkResponse(r);

    const type = r.headers.get('content-type');
    if (!type.includes('application/json')) {
        throw new ApiError(`Unexpected response type (${type}) returned`);
    }

    return r.json();
}

function patch (uri, body) {
    return fetch(uri, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

export function getRemediations () {
    const uri = urijs(API_BASE).segment('remediations').toString();

    return fetch(uri).then(json);
}

export function getRemediation (id) {
    const uri = urijs(API_BASE).segment('remediations').segment(id).toString();
    return fetch(uri).then(json);
}

export function downloadPlaybook (id) {
    const uri = urijs(API_BASE).segment('remediations').segment(id).segment('playbook').toString();
    window.open(uri);
}

export function createRemediation (data) {
    const uri = urijs(API_BASE).segment('remediations').toString();

    return fetch(uri, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        method: 'POST',
        body: JSON.stringify(data)
    }).then(json);
}

export function patchRemediation (id, data) {
    const uri = urijs(API_BASE).segment('remediations').segment(id).toString();

    return patch(uri, data)
    .then(checkResponse)
    .then(() => data);
}

export function patchRemediationIssue (id, issue, resolution) {
    const uri = urijs(API_BASE).segment('remediations').segment(id).segment('issues').segment(issue).toString();

    return patch(uri, { resolution })
    .then(checkResponse);
}

// this is here for demo purposes only
export function getHosts () {
    return fetch('/r/insights/platform/inventory/api/v1/hosts').then(json);
}

export function deleteRemediation (id) {
    const uri = urijs(API_BASE).segment('remediations').segment(id).toString();

    return fetch(uri, {
        method: 'DELETE'
    }).then(checkResponse);
}

export function deleteRemediationIssue (remediation, issue) {
    const uri = urijs(API_BASE).segment('remediations').segment(remediation).segment('issues').segment(issue).toString();

    return fetch(uri, {
        method: 'DELETE'
    }).then(checkResponse);
}

export function getResolutions (issue) {
    const uri = urijs(API_BASE).segment('resolutions').segment(issue).toString();
    return fetch(uri).then(json);
}
