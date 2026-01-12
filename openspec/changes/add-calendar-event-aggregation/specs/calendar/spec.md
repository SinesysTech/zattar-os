## ADDED Requirements

### Requirement: Unified calendar aggregation
The system SHALL provide a unified calendar view that aggregates events from multiple internal modules for a given date range.

#### Scenario: Aggregate month events from multiple sources
- **WHEN** the user opens `/app/calendar` for a month range
- **THEN** the system returns events from the configured sources (at minimum: hearings, deadlines/expedientes, obligations)
- **AND THEN** events are sorted by start date/time

### Requirement: Canonical event model
The system SHALL represent aggregated items using a canonical event model that includes source attribution and a deep-link to the source entity.

#### Scenario: Event contains deep-link and source metadata
- **WHEN** an event is returned by the calendar aggregation
- **THEN** it includes `source`, `sourceEntityId`, and `url` fields
- **AND THEN** the UI can navigate to the source entity using `url`

### Requirement: Filter by source
The system SHALL allow filtering aggregated calendar events by their source module.

#### Scenario: Filter to only hearings
- **WHEN** the user selects only the `audiencias` source
- **THEN** the calendar shows only hearing events in the selected range

### Requirement: Authorization boundaries
The system SHALL enforce module authorization boundaries when aggregating events.

#### Scenario: User without permission does not see restricted source
- **WHEN** a user lacks permission to list a given source module
- **THEN** events from that module are not included in the unified calendar response

### Requirement: MVP is read-only
In the MVP, the unified calendar SHALL be read-only with respect to domain entities.

#### Scenario: User can navigate but not edit domain entities
- **WHEN** the user clicks an aggregated event
- **THEN** the system navigates to the source entity
- **AND THEN** the calendar does not directly mutate the source entity
