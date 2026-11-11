<?php
# ex: tabstop=8 shiftwidth=8 noexpandtab
/**
* @package MediaWiki
* @subpackage WEPoll
* @author Jim Tittsler <jimt@oer.me>
* @licence GPL-2.0-or-later
*/

if( !defined( 'MEDIAWIKI' ) ) {
	die( "This file is an extension to the MediaWiki software and cannot be used standalone.\n" );
}

class APIWEPoll extends ApiBase {
	/** Upper limit on question:vote pairs in one request */
	const MAX_VOTE_PAIRS = 100;

	public static function onParserAfterTidy( &$parser, &$text ) {
		if ( strpos( $text, 'WEPoll' ) === false ) {
			return true;
		}
		$parser->getOutput()->addModuleStyles( 'ext.WEpoll' );
		$parser->getOutput()->addModules( 'ext.WEpoll' );
		return true;
	}

	public function __construct( $mainModule, $moduleName ) {
		parent :: __construct( $mainModule, $moduleName, 'po' );
	}

	public function execute() {
		$user = $this->getUser()->getId();
		$params = $this->extractRequestParams();

		if (!isset($params['ll'])) {
			$this->dieWithError(new RawMessage( 'poll argument not supplied' ),
				'missingpid');
		}
		if ( preg_match('/^[0-9a-f]{40}$/', $params['ll']) == 0 ) {
			$this->dieWithError(new RawMessage( 'bad poll argument' ),
				'badpid');
		}

		if (isset($params['vote'])) {
			// make user the user is logged in
			//error_log("User ID=$user");
			if ( $user <= 0 ) {
				$this->dieWithError( new RawMessage( 'must be logged in to vote' ),
					'notloggedin');
			}
			// parse and check every question:vote pair BEFORE touching
			// the table, so a malformed request can't delete the user's
			// existing vote and then fail to record a new one
			$votes = explode('|', $params['vote']);
			if ( count( $votes ) > self::MAX_VOTE_PAIRS ) {
				$this->dieWithError( new RawMessage( 'too many votes' ),
					'toomanyvotes');
			}
			$rows = array();
			$now = wfTimestampNow();
			foreach ($votes as $vote) {
				if ( !preg_match( '/^(\d{1,5}):(\d{1,5})$/', $vote, $m ) ) {
					$this->dieWithError( new RawMessage( 'bad vote' ),
						'badvote');
				}
				$rows[] = array('po_id' => $params['ll'],
					'po_q' => (int)$m[1],
					'po_user_id' => $user,
					'po_vote' => (int)$m[2],
					'po_timestamp' => $now
				);
			}
			// replace this user's old votes with the new ones
			$dbw = wfGetDB( DB_MASTER );
			$dbw->startAtomic( __METHOD__ );
			$dbw->delete(
				'wepoll',   // $table
				array('po_id' => $params['ll'],
				      'po_user_id' => $user),
				__METHOD__);
			$dbw->insert( 'wepoll', $rows, __METHOD__ );
			$dbw->endAtomic( __METHOD__ );
			//error_log("vote on {$params['ll']} by $user of {$params['vote']}");
		}
		
		$result = $this->getResult();
		$data = array();
		$data['poll'] = $params['ll'];

		$dbr = wfGetDB( DB_REPLICA );

		$res = $dbr->select(
			'wepoll',
			array( 'po_id', 'po_q', 'po_vote', 'count(*) AS po_count' ),
			array( 'po_id' => $params['ll'] ),
			__METHOD__,
			array( 'GROUP BY' => 'po_q,po_vote', 'ORDER BY' => 'po_q,po_vote' )
		);
		$votes = array();
		foreach ( $res as $row ) {
			$votes[] = array($row->po_q, $row->po_vote, $row->po_count);
		}
		$data['votes'] = $votes;

		$res = $dbr->select(
			'wepoll',
			array( 'po_id', 'po_q', 'po_vote', 'count(*) AS po_count' ),
			array( 'po_id' => $params['ll'], 'po_user_id' => $user ),
			__METHOD__,
			array( 'GROUP BY' => 'po_q,po_vote', 'ORDER BY' => 'po_q,po_vote' )
		);
		$uservote = array();
		foreach ( $res as $row ) {
			$uservote[] = array($row->po_q, $row->po_vote);
		}
		$data['uservote'] = $uservote;

		$res = $dbr->select(
			'wepoll',
			array( 'po_q', 'count(distinct po_user_id) AS voters' ),
			array( 'po_id' => $params['ll'] ),
			__METHOD__,
			array( 'GROUP BY' => 'po_q', 'ORDER BY' => 'po_q' )
		);
		$voters = array();
		foreach ( $res as $row ) {
			$voters[] = array($row->po_q, $row->voters);
		}
		$data['voters'] = $voters;

		$result->setIndexedTagName($data, 'poll');
		$result->addValue('poll', $this->getModuleName(), $data);
	}

	public function encodeParamName( $paramName ) {
		if ( $paramName === 'token' ) {
			return $paramName;
		}
		return parent::encodeParamName( $paramName );
	}


	public function needsToken() {
		return $this->getRequest()->getCheck( $this->encodeParamName( 'vote' ) ) ? 'csrf' : false;
	}

	/**
	 * Voting writes to the database, so declare it: the API then refuses
	 * votes while the wiki is read-only ($wgReadOnly). Reading results
	 * stays allowed.
	 */
	public function isWriteMode() {
		return $this->getRequest()->getCheck( $this->encodeParamName( 'vote' ) );
	}

	public function getAllowedParams() {
		return array (
			'll' => null,
			'vote' => null,
			'token' => null
		);
	}

	public function getParamDescription() {
		return array (
			'll' => 'SHA1 hash of poll question',
			'vote' => "pairs of question:vote separated by '|'",
			'token' => 'CSRF edit token'
		);
	}

	public function getDescription() {
		return 'Poll voting and statistics defined by WEPoll';
	}

	protected function getExamples() {
		return array (
			'api.php?action=wepoll&poll=1234ab&povote=0:1|1:2',
			'api.php?action=wepoll&poll=1234ab'
		);
	}

	public function getVersion() {
		return __CLASS__ . ': 0';
	}
}

