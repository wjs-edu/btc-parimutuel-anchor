.PHONY: sales-ready
sales-ready: proof_audit_hard
	 OK: sales-ready gates passed

	./scripts/golden_demo_status_smoke.sh
	./scripts/forbidden_words_scan.sh
	./scripts/canonical_copy_check.sh
	./scripts/cache_header_check.sh
	./scripts/screenshot_gate_check.sh
	./scripts/proof_audit.sh

proof_audit_hard:
	./scripts/gate_no_base64_html.sh
	./scripts/gate_verifier_facts.sh 1766716704

