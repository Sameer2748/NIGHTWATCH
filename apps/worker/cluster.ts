import { spawn } from 'child_process';

// Configuration
const REGIONS = [
    { id: 'india-region-id', name: 'India', workers: 3 },
    { id: 'usa-region-id', name: 'USA', workers: 3 }
];

const workers: any[] = [];

console.log('Starting Multi-Region Worker Cluster...\n');

// Start workers for each region
REGIONS.forEach(region => {
    console.log(`Starting ${region.workers} workers for ${region.name}...`);

    for (let i = 1; i <= region.workers; i++) {
        const workerId = `${region.name.toLowerCase()}-worker-${i}`;

        const worker = spawn('bun', ['index.ts'], {
            cwd: process.cwd(),
            env: {
                ...process.env,
                REGION_ID: region.id,
                WORKER_ID: workerId
            },
            stdio: 'inherit'
        });

        workers.push({ region: region.name, workerId, process: worker });

        worker.on('error', (error) => {
            console.error(`[${workerId}] Error:`, error);
        });

        worker.on('exit', (code) => {
            console.log(`[${workerId}] Exited with code ${code}`);
        });
    }
});

console.log(`\nStarted ${workers.length} workers across ${REGIONS.length} regions`);
console.log('Worker Distribution:');
REGIONS.forEach(region => {
    console.log(`   ${region.name}: ${region.workers} workers`);
});
console.log('\nPress Ctrl+C to stop all workers\n');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down all workers...');
    workers.forEach(({ workerId, process }) => {
        console.log(`   Stopping ${workerId}...`);
        process.kill();
    });
    console.log('All workers stopped');
    process.exit(0);
});
