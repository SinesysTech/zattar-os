import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();

    const metrics = [
        '# HELP process_uptime_seconds The uptime of the process in seconds',
        '# TYPE process_uptime_seconds gauge',
        `process_uptime_seconds ${uptime}`,

        '# HELP process_resident_memory_bytes Resident memory size in bytes',
        '# TYPE process_resident_memory_bytes gauge',
        `process_resident_memory_bytes ${memory.rss}`,

        '# HELP process_heap_total_bytes Total heap size in bytes',
        '# TYPE process_heap_total_bytes gauge',
        `process_heap_total_bytes ${memory.heapTotal}`,

        '# HELP process_heap_used_bytes Used heap size in bytes',
        '# TYPE process_heap_used_bytes gauge',
        `process_heap_used_bytes ${memory.heapUsed}`,

        '# HELP nodejs_cpu_user_seconds_total Total user CPU time spent in seconds',
        '# TYPE nodejs_cpu_user_seconds_total counter',
        `nodejs_cpu_user_seconds_total ${cpu.user / 1000000}`,

        '# HELP nodejs_cpu_system_seconds_total Total system CPU time spent in seconds',
        '# TYPE nodejs_cpu_system_seconds_total counter',
        `nodejs_cpu_system_seconds_total ${cpu.system / 1000000}`,
    ].join('\n');

    return new NextResponse(metrics, {
        headers: {
            'Content-Type': 'text/plain; version=0.0.4',
        },
    });
}
