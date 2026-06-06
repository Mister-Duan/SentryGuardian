import { initPerfume } from 'perfume.js';

console.log('prefumex', 'prefumex');

initPerfume({
  analyticsTracker: options => {
    console.log('options', options,options?.metricName);
    // console.log('options', );
    // const {
    //   attribution,
    //   metricName,
    //   data,
    //   navigatorInformation,
    //   rating,
    //   navigationType,
    // } = options;
    // switch (metricName) {
    //   case 'navigationTiming':
    //     if (data && data.timeToFirstByte) {
    //       myAnalyticsTool.track('navigationTiming', data);
    //     }
    //     break;
    //   case 'networkInformation':
    //     if (data && data.effectiveType) {
    //       myAnalyticsTool.track('networkInformation', data);
    //     }
    //     break;
    //   case 'storageEstimate':
    //     myAnalyticsTool.track('storageEstimate', data);
    //     break;
    //   case 'TTFB':
    //     myAnalyticsTool.track('timeToFirstByte', { duration: data });
    //     break;
    //   case 'RT':
    //     myAnalyticsTool.track('redirectTime', { duration: data });
    //     break;
    //   case 'FCP':
    //     myAnalyticsTool.track('firstContentfulPaint', { duration: data });
    //     break;
    //   case 'FID':
    //     myAnalyticsTool.track('firstInputDelay', { duration: data });
    //     break;
    //   case 'LCP':
    //     myAnalyticsTool.track('largestContentfulPaint', { duration: data });
    //     break;
    //   case 'CLS':
    //     myAnalyticsTool.track('cumulativeLayoutShift', { value: data });
    //     break;
    //   case 'INP':
    //     myAnalyticsTool.track('interactionToNextPaint', { value: data });
    //     break;
    //   case 'TBT':
    //     myAnalyticsTool.track('totalBlockingTime', { duration: data });
    //     break;
    //   case 'elPageTitle':
    //     myAnalyticsTool.track('elementTimingPageTitle', { duration: data });
    //     break;
    //   case 'userJourneyStep':
    //     myAnalyticsTool.track('userJourneyStep', {
    //       duration: data,
    //       stepName: attribution.step_name,
    //       vitals_score: rating,
    //     });
    //     break;
    //   default:
    //     myAnalyticsTool.track(metricName, { duration: data });
    //     break;
    // }
  },
});