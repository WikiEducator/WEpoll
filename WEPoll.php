<?php
# ex: tabstop=8 shiftwidth=8 noexpandtab
/**
* @package MediaWiki
* @subpackage WEPoll
* @author Jim Tittsler <jim@OERfoundation.org>
* @licence GPL2
*/

if( !defined( 'MEDIAWIKI' ) ) {
	die( "This file is an extension to the MediaWiki software and cannot be used standalone.\n" );
}

$wgExtensionCredits['parserhook'][] = array(
	'name'           => 'WEPoll',
	'version'        => '0.2',
	'url'            => 'http://WikiEducator.org/Extension:WEPoll',
	'author'         => '[http://WikiEducator.org/User:JimTittsler Jim Tittsler]',
        'description'    => 'add API calls for a simple Javascript poll',
);

$wgAPIModules['wepoll'] = 'APIWEPoll';

class APIWEPoll extends ApiQueryBase {
	public function __construct( $query, $moduleName ) {
		parent :: __construct( $query, $moduleName, 'po' );
	}

	public function execute() {
		global $wgUser;
		$user = $wgUser->getId();
		$params = $this->extractRequestParams();

		if (!isset($params['ll'])) {
			$this->dieUsage('poll argument not supplied',
				'missingpid');
		}
		if ( preg_match('/^[0-9a-f]{40}$/', $params['ll']) == 0 ) {
			$this->dieUsage('bad poll argument',
				'badpid');
		}

		if (isset($params['vote'])) {
			// make user the user is logged in
			//error_log("User ID=$user");
			if ( $user <= 0 ) {
				$this->dieUsage('must be logged in to vote',
					'notloggedin');
			}
			// make sure the poll exists
			// record this user's vote
			$dbr = $this->GetDB();
			$votes = explode('|', $params['vote']);
			foreach ($votes as $vote) {
				$q = explode(':', $vote);
				$res = $dbr->replace(
					'wepoll',     // $table
					array('po_id', 'po_q', 'po_user_id'),
					array('po_id' => $params['ll'],
						'po_q' => $q[0],
						'po_user_id' => $user,
						'po_vote' => $q[1],
						'po_timestamp' => wfTimestampNow()
					),      // rows
					__METHOD__);
			}
			//error_log("vote on {$params['ll']} by $user of {$params['vote']}");
		}
		
		$result = $this->getResult();
		$data = array();

		$this->addTables('wepoll');
		$this->addFields('po_id');
		$this->addFields('po_q');
		$this->addFields('po_vote');
		$this->addFields('count(*) AS po_count');

		$this->addWhereFld('po_id', $params['ll']);
		$this->addOption('GROUP BY', 'po_q,po_vote');
		$this->addOption('ORDER BY', 'po_q,po_vote');
		$res = $this->select(__METHOD__);

		$votes = array();
		foreach ( $res as $row ) {
			$votes[] = array($row->po_q, $row->po_vote, $row->po_count);
		}
		$data['poll'] = $params['ll'];
		$data['votes'] = $votes;

		$this->addWhereFld('po_user_id', $user);
		$res = $this->select(__METHOD__);
		$uservote = array();
		foreach ( $res as $row ) {
			$uservote[] = array($row->po_q, $row->po_vote);
		}
		$data['uservote'] = $uservote;
		$result->setIndexedTagName($data, 'poll');
		$result->addValue('poll', $this->getModuleName(), $data);
	}

	protected function getDB() {
		return wfGetDB( DB_MASTER );
	}

	public function getAllowedParams() {
		return array (
			'll' => null,
			'vote' => null
		);
	}

	public function getParamDescription() {
		return array (
			'll' => 'SHA1 hash of poll question',
			'vote' => "pairs of question:vote separated by '|'"
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

