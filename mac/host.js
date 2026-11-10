/* Native AppKit + WebKit intro host, run by macOS JavaScript for Automation. */
ObjC.import('Cocoa');ObjC.import('WebKit');
var tidalWindow,tidalView,tidalTimer,tidalControl,tidalStatus,tidalStarted=Date.now(),tidalClosing=0,tidalPrepared=false;
function saveState(phase){var value=JSON.stringify({phase:phase,time:new Date().toISOString(),platform:'darwin'});$(value).writeToFileAtomicallyEncodingError($(tidalStatus),true,$.NSUTF8StringEncoding,null)}
function readStage(){var s=$.NSString.stringWithContentsOfFileEncodingError($(tidalControl),$.NSUTF8StringEncoding,null);if(!s)return '';try{return JSON.parse(ObjC.unwrap(s)).stage}catch(e){return ''}}
function openWorkspace(){if(tidalPrepared)return;var ok=$.NSWorkspace.sharedWorkspace.openURL($.NSURL.URLWithString('codex://threads/new'));if(!ok){saveState('error');throw Error('Codex is not installed or codex:// is not registered')}tidalPrepared=true;saveState('workspace-ready')}
ObjC.registerSubclass({name:'TidalTimerTarget',superclass:'NSObject',methods:{'tick:':{types:['void',['id']],implementation:function(){
 try{var stage=readStage();if(stage==='abort'||Date.now()-tidalStarted>600000){saveState('cancelled');$.NSApplication.sharedApplication.terminate(null);return}
 if(stage==='prepare'&&!tidalPrepared)openWorkspace();
 if(stage==='complete'&&!tidalClosing){openWorkspace();tidalClosing=Date.now();saveState('crossfading')}
 if(tidalClosing){var p=Math.min(1,(Date.now()-tidalClosing)/900),q=p*p*(3-2*p);tidalWindow.alphaValue=1-q;if(p>=1){tidalWindow.orderOut(null);saveState('done');$.NSApplication.sharedApplication.terminate(null)}}
 }catch(e){saveState('error');$.NSApplication.sharedApplication.terminate(null)}
}}}});
function run(argv){
 if(argv.length===1&&argv[0]==='--self-test'){var c=$.WKWebViewConfiguration.alloc.init;c.mediaTypesRequiringUserActionForPlayback=0;return 'PASS: AppKit, WebKit, timer bridge and playback configuration';}
 if(argv.length!==3)throw Error('Expected URL, control path and status path');var url=argv[0];if(!/^http:\/\/127\.0\.0\.1:\d+\//.test(url))throw Error('Only a local intro URL is accepted');tidalControl=argv[1];tidalStatus=argv[2];
 var app=$.NSApplication.sharedApplication;app.setActivationPolicy(1);var frame=$.NSScreen.mainScreen.frame;
 tidalWindow=$.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(frame,0,2,false);tidalWindow.level=3;tidalWindow.collectionBehavior=257;tidalWindow.backgroundColor=$.NSColor.blackColor;tidalWindow.opaque=true;tidalWindow.releasedWhenClosed=false;
 var config=$.WKWebViewConfiguration.alloc.init;config.mediaTypesRequiringUserActionForPlayback=0;
 tidalView=$.WKWebView.alloc.initWithFrameConfiguration($.NSMakeRect(0,0,frame.size.width,frame.size.height),config);tidalView.autoresizingMask=18;tidalWindow.contentView=tidalView;
 tidalView.loadRequest($.NSURLRequest.requestWithURL($.NSURL.URLWithString($(url))));tidalWindow.makeKeyAndOrderFront(null);app.activateIgnoringOtherApps(true);
 var target=$.TidalTimerTarget.alloc.init;tidalTimer=$.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(.016,target,'tick:',null,true);saveState('intro-visible');app.run;
}
