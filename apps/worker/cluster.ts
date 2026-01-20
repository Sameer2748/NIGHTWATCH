import { spawn } from 'child_process';

// Configuration
const REGIONS = [
    { id: 'india-region-id', name: 'India', workers: 3 },
    { id: 'usa-region-id', name: 'USA', workers: 3 }
];

const processes: Map<string, any> = new Map();


function startWorker(region: any, index: number) {
    const workerId = `${region.name.toLowerCase()}-worker-${index}`;

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
        setTimeout(() => startWorker(region, index), 5000);
    });

    child.on('error', (err) => {
    });
}

// Start workers for each region
REGIONS.forEach(region => {
    for (let i = 1; i <= region.workers; i++) {
        startWorker(region, i);
    }
});


// Graceful shutdown
process.on('SIGINT', () => {
    processes.forEach((child, workerId) => {
        child.removeAllListeners('exit'); // Prevent restart on manual kill
        child.kill();
    });
    process.exit(0);
});
