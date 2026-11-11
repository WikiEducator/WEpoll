CREATE TABLE /*_*/wepoll (
	po_id VARCHAR(40) NOT NULL,
	po_q INT(5) UNSIGNED NOT NULL,
	po_user_id INT(5) UNSIGNED NOT NULL,
	po_vote INT(5) DEFAULT NULL,
	po_timestamp CHAR(14) NOT NULL DEFAULT ''
) /*$wgDBTableOptions*/;

CREATE INDEX /*i*/mwidx_po_id ON /*_*/wepoll (po_id);
