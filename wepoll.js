/**
 * wepoll.js
 * Copyright 2011 Open Education Resource Foundation
 * @author James Tittsler <jim@OERfoundation.org>
 * @license BSD
 */

/** includes crypto-js SHA1 library
 * crypto-js
 * @link http://code.google.com/p/crypto-js/#SHA-1
 * @license BSD
 */

if(typeof Crypto=="undefined"||!Crypto.util)(function(){var i=window.Crypto={},l=i.util={rotl:function(a,c){return a<<c|a>>>32-c},rotr:function(a,c){return a<<32-c|a>>>c},endian:function(a){if(a.constructor==Number)return l.rotl(a,8)&16711935|l.rotl(a,24)&4278255360;for(var c=0;c<a.length;c++)a[c]=l.endian(a[c]);return a},randomBytes:function(a){for(var c=[];a>0;a--)c.push(Math.floor(Math.random()*256));return c},bytesToWords:function(a){for(var c=[],b=0,d=0;b<a.length;b++,d+=8)c[d>>>5]|=a[b]<<24-
d%32;return c},wordsToBytes:function(a){for(var c=[],b=0;b<a.length*32;b+=8)c.push(a[b>>>5]>>>24-b%32&255);return c},bytesToHex:function(a){for(var c=[],b=0;b<a.length;b++){c.push((a[b]>>>4).toString(16));c.push((a[b]&15).toString(16))}return c.join("")},hexToBytes:function(a){for(var c=[],b=0;b<a.length;b+=2)c.push(parseInt(a.substr(b,2),16));return c},bytesToBase64:function(a){if(typeof btoa=="function")return btoa(m.bytesToString(a));for(var c=[],b=0;b<a.length;b+=3)for(var d=a[b]<<16|a[b+1]<<
8|a[b+2],e=0;e<4;e++)b*8+e*6<=a.length*8?c.push("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(d>>>6*(3-e)&63)):c.push("=");return c.join("")},base64ToBytes:function(a){if(typeof atob=="function")return m.stringToBytes(atob(a));a=a.replace(/[^A-Z0-9+\/]/ig,"");for(var c=[],b=0,d=0;b<a.length;d=++b%4)d!=0&&c.push(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(a.charAt(b-1))&Math.pow(2,-2*d+8)-1)<<d*2|"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(a.charAt(b))>>>
6-d*2);return c}};i.mode={};i=i.charenc={};i.UTF8={stringToBytes:function(a){return m.stringToBytes(unescape(encodeURIComponent(a)))},bytesToString:function(a){return decodeURIComponent(escape(m.bytesToString(a)))}};var m=i.Binary={stringToBytes:function(a){for(var c=[],b=0;b<a.length;b++)c.push(a.charCodeAt(b)&255);return c},bytesToString:function(a){for(var c=[],b=0;b<a.length;b++)c.push(String.fromCharCode(a[b]));return c.join("")}}})();
(function(){var i=Crypto,l=i.util,m=i.charenc,a=m.UTF8,c=m.Binary,b=i.SHA1=function(d,e){var g=l.wordsToBytes(b._sha1(d));return e&&e.asBytes?g:e&&e.asString?c.bytesToString(g):l.bytesToHex(g)};b._sha1=function(d){if(d.constructor==String)d=a.stringToBytes(d);var e=l.bytesToWords(d),g=d.length*8;d=[];var n=1732584193,h=-271733879,j=-1732584194,k=271733878,o=-1009589776;e[g>>5]|=128<<24-g%32;e[(g+64>>>9<<4)+15]=g;for(g=0;g<e.length;g+=16){for(var q=n,r=h,s=j,t=k,u=o,f=0;f<80;f++){if(f<16)d[f]=e[g+
f];else{var p=d[f-3]^d[f-8]^d[f-14]^d[f-16];d[f]=p<<1|p>>>31}p=(n<<5|n>>>27)+o+(d[f]>>>0)+(f<20?(h&j|~h&k)+1518500249:f<40?(h^j^k)+1859775393:f<60?(h&j|h&k|j&k)-1894007588:(h^j^k)-899497514);o=k;k=j;j=h<<30|h>>>2;h=n;n=p}n+=q;h+=r;j+=s;k+=t;o+=u}return[n,h,j,k,o]};b._blocksize=16;b._digestsize=20})();

function WEPoll(marker, ops, bars, disabled) {
  var i;
  var options = {};
  var barcolors = ['red', 'blue', 'orange', 'green'];
  var op = ops.replace(/\s/g, '').toLowerCase().split(',');

  for (i=0; i<op.length; ++i) {
    options[op[i]] = true;
  }
  if (bars) {
    barcolors = htmlEscape(bars).split(',');
    if (barcolors.length > 0) {
      options.bars = true;
    } else {
      barcolors = ['white'];
    }
  }
  if (disabled) {
    options.disabled = htmlEscape(disabled);
  }

  var weAPI = wgServer + '/api.php';

  if (typeof this.polls == "undefined") {
    this.polls = [];
    this.responses = [];
  }

  function htmlEscape(s) {
    return(s.replace(/&/g,'&amp;').
        replace(/>/g, '&gt;').
        replace(/</g, '&lt;').
        replace(/"/g, '&quot;'));
  }

  function dovote() {
    var sub = $(this).attr('id');
    var pix = sub.split('_')[1];
    $('#' + sub).unbind('click').attr('disabled', true).attr('val', '          ');
    var votes = '';
    $('input[id^=WEPoll_' + pix + ']:checked').each(function(i) {
      var idp = $(this).attr('id').split('_');
      if (votes.length) { votes += '|'; }
      votes += idp[2] + ':' + idp[3];
    });
    if (votes) {
      $.ajax({
        url: weAPI,
        data: {
          action: 'wepoll',
          format: 'json',
          poll: polls[pix],
          povote: votes
        },
        async: true,
        type: 'POST',
        dataType: 'json',
        success: showvotes,
        failure: function() {alert('unable to register your vote');}
      });
    }
    return false;
  }

  function showvotes(data) {
    var pid, pix, i, q, r;
    var vc, basis, qvoters;
    var vqr = [];
    var votescounted = [];
    var thispoll = data && data.poll && data.poll.wepoll;
    if (thispoll && (pid = thispoll.poll) && ((pix = $.inArray(pid, polls)) >= 0)) {
      var uservote = thispoll.uservote;
      var votes = thispoll.votes;
      var voters = thispoll.voters;

      /*  voted   loggedin  anon   after    show
          1       ?         ?      ?        1
          0       ?         0      0        1
          0       ?         0      1        0
          0       0         1      0        1
          0       1         1      0        0
      */
      var show = true;
      if (uservote.length === 0) {
        if ('after' in options) { show = false; }
        if (('anon' in options) && (wgUserName !== null)) { show = false; }
      }

      if (show) {
        if ('count' in options) {
          $('div.WEPollcount', $('#WEPoll_' + pix)).text('0');
        } else if ('percent' in options) {
          $('div.WEPollcount', $('#WEPoll_' + pix)).text('0%');
        }
        if ('voters' in options) {
          $('div.WEPollvoters', $('#WEPoll_' + pix)).text('0 voters');
        }
        var thisresponses = responses[pix];
        for (q=0; q<thisresponses.length; ++q) {
          votescounted[q] = 0;
          vqr.push([]);
          for (r=0; r<=thisresponses[q]; ++r) {
            vqr[q][r] = 0;
          }
        }
        for (i=0; i<voters.length; ++i) {
          q = parseInt(voters[i][0], 10);
          r = parseInt(voters[i][1], 10);
          if ((q >= 0) && (r >= 0)) {
            votescounted[q] = r;
          }
        }

        // votes are tuples (question, response, count)
        for (i=0; i<votes.length; ++i) {
          q = parseInt(votes[i][0], 10);
          r = parseInt(votes[i][1], 10);
          if ((q >= 0) && (q < thisresponses.length) && (r >= 0) && (r <= thisresponses[q])) {
            vc = parseInt(votes[i][2], 10);
            vqr[q][r] = vc;
          }
        }

        for (q=0; q<thisresponses.length; ++q) {
          for (r=0; r<=thisresponses[q]; ++r) {
            vc = vqr[q][r];
            if ('count' in options) {
              $('#WEPoll_' + pix + '_' + q + '_' + r + 'c').text(vc);
            }
            basis = votescounted[q] || 1;
            p = Math.round(100*vc/basis);
            if ('percent' in options) {
              $('#WEPoll_' + pix + '_' + q + '_' + r + 'c').text(p + '%');
            }
            if ('bars' in options) {
              $('#WEPoll_' + pix + '_' + q + '_' + r + 'b').animate({width: p+'px'}, 'fast');
            }
          }
          // show number of voters for each question
          if ('voters' in options) {
            qvoters = votescounted[q] || 0;
            $('#WEPoll_' + pix + '_' + q + 'v').text(qvoters + ' voter' + ((qvoters==1) ? '' : 's'));
          }
        }
      }

      $b = $('#WEPollsub_'+pix);
      if ('disabled' in options) {
        $b.hide().attr('disabled', true);
        if (typeof options.disabled == "string") {
          $b.parent().addClass('WEPolldisabled').text(options.disabled);
        }
      } else {
        if (uservote.length) {
          $b.attr('value', 'Change my vote');
          for (i=0; i<uservote.length; i++) {
            $('#WEPoll_' + pix + '_' + parseInt(uservote[i][0],10) + '_' + parseInt(uservote[i][1],10)).attr('checked', 'checked');
          }
        } else {
          $b.attr('value', '     Vote     ');
        }
        $b.show().click(dovote).attr('disabled', false);
      }
    }
  }

  function setupPoll($p) {
    var pid = Crypto.SHA1($p.text().replace(/\s/g, ''));
    var pix = polls.length;
    polls.push(pid);
    responses.push([]);
    $p.wrap('<form id="WEPoll_' + pix + '" style="background: ' + options + '"></form>');
    var $pform = $p.parent();
    if (wgUserName) {
      $pform.append('<div class="WEPollbutton"><input type="submit" onclick="return false;" value="                        " style="display:hidden;" id="WEPollsub_' + pix +'"/></div>');
    } else {
      $pform.append('<div class="WEPollbutton"><a href="/index.php?title=Special:UserLogin&amp;returnto=' + escape(wgPageName) + '">You must be logged in to vote' + (('after' in options) ? ' or see results' : '') + '</a></div>');
    }
    $p.children('ol,ul').each( function(i) {
      var qid = 'WEPoll_' + pix;
      $(this).children('li').each( function(j) {
        var qid = 'WEPoll_' + pix + '_' + j;
        var multi = ($(this).children('ol').length > 0);
        $(this).find('li').each( function(k) {
          var rid = qid + '_' + k;
          $(this).replaceWith('<li class="WEPollre"><div class="WEPollc"><div class="WEPollbarc"><div class="WEPollbar" id="' + rid + 'b" style="width: 0px; background-color: ' + barcolors[k % barcolors.length] + ';">&nbsp;</div></div><div class="WEPollcount" id="' + rid + 'c"></div></div><input type="' + ((multi) ? 'checkbox' : 'radio') + '" name="' + qid + '" id="' + rid + '"/><label for="' + rid + '">' + $(this).html() + '</label></li>');
          responses[pix][j] = k;
        });
        $(this).replaceWith('<li class="WEPollq"><div class="WEPollqc"><div class="WEPollvoters" id="' + qid + 'v"></div></div>' + $(this).html() + '</li>');
      });
    });

    pix++;
    $.ajax({
      url: weAPI,
      data: {
        action: 'wepoll',
        format: 'json',
        poll: pid
      },
      async: true,
      type: 'POST',
      dataType: 'json',
      success: showvotes,
      failure: function() {
        alert('unable to retrieve poll results');
      }
    });
  }

  // find the next poll after our marker
  $('#'+marker).closest('p').nextAll('div.WEPoll:first').each(function(i) { setupPoll($(this)); });
}
