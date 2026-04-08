
-- View: aggregated feedback for AI learning context
CREATE OR REPLACE VIEW public.popular_products_by_event AS
SELECT
  qr.event_type,
  qpi.product_name,
  qpi.product_id,
  qp.tier,
  COUNT(*) AS times_included,
  COUNT(qf.id) FILTER (WHERE qf.selected_tier = qp.tier) AS times_selected,
  COUNT(qf.id) FILTER (WHERE qf.accepted = true) AS times_accepted,
  ROUND(AVG(qpi.unit_price)::numeric, 2) AS avg_price,
  ROUND(AVG(qpi.score)::numeric, 0) AS avg_score,
  ROUND(AVG(qr.people_count)::numeric, 0) AS avg_people
FROM quote_package_items qpi
JOIN quote_packages qp ON qp.id = qpi.package_id
JOIN quote_proposals qpr ON qpr.id = qp.proposal_id
JOIN quote_requests qr ON qr.id = qpr.quote_request_id
LEFT JOIN quote_feedback qf ON qf.proposal_id = qpr.id
GROUP BY qr.event_type, qpi.product_name, qpi.product_id, qp.tier
ORDER BY times_selected DESC, times_included DESC;
