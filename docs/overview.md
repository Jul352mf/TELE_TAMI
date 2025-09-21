# TELE TAMI Overview

TELE TAMI is an AI voice assistant for capturing structured commodity trading leads via natural conversation. Built on Hume's Empathic Voice Interface (EVI), it combines real‑time emotional adaptation with a structured prompt and tool contract to produce validated lead JSON objects that are persisted and distributed (Firestore, Sheets, Email).

## Value Proposition
- Reduce friction in lead capture during fast paced trading conversations.
- Standardize data quality while preserving rapport and human tone.
- Enable multi-lead sequential capture in a single session.

## Core Capabilities
- Voice session with emotional mirroring & persona styles.
- Structured lead extraction and validation (Ajv schema).
- Persist + notify pipeline (Firestore → Sheets → Email).
- Configurable consent modes & retention policy (planned enforcement).

## Non-Goals (Current Scope)
- Automated pricing intelligence.
- Order execution / transactional commitments.
- Post-conversation analytics dashboards (future possibility).

## Personas
See `prompting.md` for detailed persona overlays (professional, unhinged, cynical) and mode (Ole interview).
