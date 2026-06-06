-- Backfill issue taxonomy columns from each issue's latest ERROR event payload.
UPDATE issues AS i
SET
  exception_type = COALESCE(
    latest.ex_type,
    i.exception_type
  ),
  mechanism = COALESCE(
    latest.mech,
    i.mechanism
  )
FROM (
  SELECT DISTINCT ON (e.issue_id)
    e.issue_id,
    e.payload #>> '{exception,values,0,type}' AS ex_type,
    COALESCE(
      e.payload #>> '{exception,values,0,mechanism,type}',
      e.payload #>> '{tags,error.type}'
    ) AS mech
  FROM events e
  WHERE e.issue_id IS NOT NULL
    AND e.event_type = 'ERROR'
  ORDER BY e.issue_id, e.timestamp DESC
) AS latest
WHERE i.id = latest.issue_id
  AND (i.exception_type IS NULL OR i.mechanism IS NULL);
