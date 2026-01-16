import { spawn } from 'child_process';

// Configuration
const REGIONS = [
    { id: 'india-region-id', name: 'India', workers: 3 },
    { id: 'usa-region-id', name: 'USA', workers: 3 }
];

const processes: Map<string, any> = new Map();

console.log('Starting Multi-Region Worker Cluster with Auto-Restart...\n');

function startWorker(region: any, index: number) {
    const workerId = `${region.name.toLowerCase()}-worker-${index}`;
    console.log(`[${workerId}] Starting worker...`);

    const child = spawn('bun', ['index.ts'], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            REGION_ID: region.id,
            WORKER_ID: workerId
        },
        stdio: 'inherit'
    });

    processes.set(workerId, child);

    child.on('exit', (code, signal) => {
        processes.delete(workerId);
        console.log(`[${workerId}] Exited with code ${code} and signal ${signal}. Restarting in 5s...`);
        setTimeout(() => startWorker(region, index), 5000);
    });

    child.on('error', (err) => {
        console.error(`[${workerId}] Spawn error:`, err);
    });
}

// Start workers for each region
REGIONS.forEach(region => {
    for (let i = 1; i <= region.workers; i++) {
        startWorker(region, i);
    }
});

console.log(`\nStarted ${REGIONS.reduce((acc, r) => acc + r.workers, 0)} workers across ${REGIONS.length} regions`);
console.log('Press Ctrl+C to stop all workers and the cluster manager\n');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down all workers...');
    processes.forEach((child, workerId) => {
        console.log(`   Stopping ${workerId}...`);
        child.removeAllListeners('exit'); // Prevent restart on manual kill
        child.kill();
    });
    console.log('All workers stopped');
    process.exit(0);
});
