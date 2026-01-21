import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,
    duration: '10s',
};

export default function smokeTest() {
    const res = http.get('http://host.docker.internal:3000');
    check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(1);
}
