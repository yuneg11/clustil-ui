import type { Node } from "@/types";

const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_HOUR = 1000 * 60 * 60;
const ONE_MINUTE = 1000 * 60;

function randomBetween(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

export function generateDemoData(): Node[] {
  return [
    {
      id: "node-01",
      name: "Node-01",
      active: true,
      temp: randomInt(40, 100),
      util: randomInt(10, 95),
      memory: { used: randomInt(64, 450), total: 512 },
      gpus: [
        {
          id: "gpu-1-0",
          index: 0,
          name: "RTX 4090",
          active: true,
          temp: randomInt(30, 85),
          util: randomInt(0, 100),
          memory: { used: randomBetween(0.2, 24), total: 24 },
          user: {
            name: "john.doe",
            timestamp: new Date(Date.now() - ONE_DAY),
          },
        },
        {
          id: "gpu-1-1",
          index: 1,
          name: "RTX 4090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 10),
          memory: { used: randomBetween(0.1, 2), total: 24 },
          user: {
            name: "john.doe",
            timestamp: new Date(Date.now() - ONE_HOUR * 12),
          },
        },
        {
          id: "gpu-1-2",
          index: 2,
          name: "RTX 4090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 10),
          memory: { used: randomBetween(0.1, 2), total: 24 },
          user: {
            name: "eg.yun",
            timestamp: new Date(Date.now() - ONE_MINUTE * 10),
          },
        },
        {
          id: "gpu-1-3",
          index: 3,
          name: "RTX 4090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 10),
          memory: { used: randomBetween(0.1, 2), total: 24 },
          user: {
            name: "eg.yun",
            timestamp: new Date(Date.now() - ONE_MINUTE * 10),
          },
        },
      ],
    },
    {
      id: "node-02",
      name: "Node-02",
      active: true,
      temp: randomInt(40, 70),
      util: randomInt(50, 100),
      memory: { used: randomInt(40, 64), total: 64 },
      gpus: [
        {
          id: "gpu-2-0",
          index: 0,
          name: "A100",
          active: true,
          temp: randomInt(60, 85),
          util: randomInt(80, 100),
          memory: { used: randomBetween(60, 80), total: 80 },
          user: {
            name: "alice",
            timestamp: new Date(Date.now()),
          },
        },
        {
          id: "gpu-2-1",
          index: 1,
          name: "A100",
          active: true,
          temp: randomInt(60, 85),
          util: randomInt(80, 100),
          memory: { used: randomBetween(60, 80), total: 80 },
          user: {
            name: "alice",
            timestamp: new Date(Date.now()),
          },
        },
        {
          id: "gpu-2-2",
          index: 2,
          name: "A100 80GB",
          active: true,
          temp: randomInt(25, 50),
          util: randomInt(30, 70),
          memory: { used: randomBetween(10, 40), total: 80 },
          user: {
            name: "alice",
            timestamp: new Date(Date.now() - ONE_MINUTE * 10 - ONE_HOUR * 3),
          },
        },
      ],
    },
    {
      id: "node-03",
      name: "Node-03",
      active: true,
      temp: randomInt(30, 50),
      util: randomInt(5, 30),
      memory: { used: randomInt(4, 20), total: 64 },
      gpus: [
        {
          id: "gpu-3-0",
          index: 0,
          name: "RTX 3090",
          active: true,
          temp: randomInt(30, 50),
          util: randomInt(0, 15),
          memory: { used: randomBetween(0.5, 5), total: 24 },
        },
        {
          id: "gpu-3-1",
          index: 1,
          name: "RTX 3090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 5),
          memory: { used: randomBetween(0, 2), total: 24 },
        },
      ],
    },
    {
      id: "node-04",
      name: "Node-04",
      active: true,
      temp: randomInt(30, 50),
      util: randomInt(5, 30),
      memory: { used: randomInt(4, 20), total: 64 },
      gpus: [
        {
          id: "gpu-4-0",
          index: 0,
          name: "RTX 3090",
          active: true,
          temp: randomInt(30, 50),
          util: randomInt(0, 15),
          memory: { used: randomBetween(0.5, 5), total: 24 },
        },
        {
          id: "gpu-4-1",
          index: 1,
          name: "RTX 3090",
          active: true,
          temp: randomInt(25, 45),
          util: randomInt(0, 5),
          memory: { used: randomBetween(0, 2), total: 24 },
        },
      ],
    },
    {
      id: "node-05",
      name: "Node-05",
      active: false,
      gpus: [
        {
          id: "gpu-5-0",
          index: 0,
          name: "RTX 4090",
          active: false,
        },
        {
          id: "gpu-5-1",
          index: 1,
          name: "RTX 4090",
          active: false,
        },
      ],
    },
  ];
}
