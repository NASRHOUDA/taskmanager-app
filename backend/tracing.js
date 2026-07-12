const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { resourceFromAttributes } = require('@opentelemetry/resources');

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'taskmanager-backend',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector.monitoring.svc.cluster.local:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
