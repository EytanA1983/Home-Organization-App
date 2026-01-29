{{/*
Expand the name of the chart.
*/}}
{{- define "eli-maor.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "eli-maor.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "eli-maor.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "eli-maor.labels" -}}
helm.sh/chart: {{ include "eli-maor.chart" . }}
{{ include "eli-maor.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "eli-maor.selectorLabels" -}}
app.kubernetes.io/name: {{ include "eli-maor.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "eli-maor.backend.labels" -}}
{{ include "eli-maor.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "eli-maor.backend.selectorLabels" -}}
{{ include "eli-maor.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "eli-maor.frontend.labels" -}}
{{ include "eli-maor.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "eli-maor.frontend.selectorLabels" -}}
{{ include "eli-maor.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Worker labels
*/}}
{{- define "eli-maor.worker.labels" -}}
{{ include "eli-maor.labels" . }}
app.kubernetes.io/component: worker
{{- end }}

{{/*
Worker selector labels
*/}}
{{- define "eli-maor.worker.selectorLabels" -}}
{{ include "eli-maor.selectorLabels" . }}
app.kubernetes.io/component: worker
{{- end }}

{{/*
Beat labels
*/}}
{{- define "eli-maor.beat.labels" -}}
{{ include "eli-maor.labels" . }}
app.kubernetes.io/component: beat
{{- end }}

{{/*
Beat selector labels
*/}}
{{- define "eli-maor.beat.selectorLabels" -}}
{{ include "eli-maor.selectorLabels" . }}
app.kubernetes.io/component: beat
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "eli-maor.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "eli-maor.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database URL
*/}}
{{- define "eli-maor.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
postgresql+psycopg2://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "eli-maor.fullname" . }}-postgresql:5432/{{ .Values.postgresql.auth.database }}
{{- else }}
{{ .Values.externalDatabase.url }}
{{- end }}
{{- end }}

{{/*
Redis URL
*/}}
{{- define "eli-maor.redisUrl" -}}
{{- if .Values.redis.enabled }}
redis://{{ include "eli-maor.fullname" . }}-redis-master:6379/0
{{- else }}
{{ .Values.externalRedis.url }}
{{- end }}
{{- end }}

{{/*
Config checksum for rolling updates
*/}}
{{- define "eli-maor.configChecksum" -}}
{{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
{{- end }}

{{/*
Secret checksum for rolling updates
*/}}
{{- define "eli-maor.secretChecksum" -}}
{{- if .Values.secrets.create }}
{{ include (print $.Template.BasePath "/secrets.yaml") . | sha256sum }}
{{- else }}
"external"
{{- end }}
{{- end }}
