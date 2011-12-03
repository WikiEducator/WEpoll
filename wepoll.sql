CREATE TABLE mw_wepoll (
	po_id VARCHAR(40) NOT NULL,
	po_q INT(5) UNSIGNED NOT NULL,
	po_user_id INT(5) UNSIGNED NOT NULL,
	po_vote INT(5) DEFAULT NULL,
	po_timestamp CHAR(14) NOT NULL DEFAULT '',
) /*$wgDBTableOptions*/;

CREATE INDEX mwidx_po_id ON mw_wepoll (po_id);
