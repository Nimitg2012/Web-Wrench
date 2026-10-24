import type {
  ActivityItem,
  CheckoutStep,
  Explanation,
  FormSnapshot,
  Incident,
  Issue,
  LinkCheck,
  PageSnapshot,
  TimelineEvent,
  UptimePoint,
  Website,
} from '../types/index.ts'

export const DEMO_WEBSITE_ID = 'demo'
export const ISSUE_CHECKOUT = 'demo-checkout'
export const ISSUE_FORM = 'demo-form'
export const ISSUE_LINK = 'demo-link'
export const ISSUE_UPTIME = 'demo-uptime'
export const ISSUE_BOOKING = 'demo-booking'

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

export const DEMO_CHECKED_AT = ago(2)

export const DEMO_WEBSITE: Website = {
  id: DEMO_WEBSITE_ID,
  name: 'Northwind Demo Store',
  url: 'https://demo-store.webwrench.app',
  isDemo: true,
  addedAt: ago(60 * 24 * 12),
  features: { uptime: true, brokenLinks: true, pages: true, forms: true, checkout: true },
  pages: [],
  forms: [],
  checkout: {
    environmentUrl: 'https://demo-store.webwrench.app',
    testAccountLabel: 'Tutorial shopper',
    steps: ['Product page', 'Cart', 'Checkout', 'Confirmation'],
  },
  reachability: null,
}

const checkoutExplanation: Explanation = {
  whatHappened: 'The checkout process did not reach the expected confirmation page.',
  why: [
    'The payment step may have been unavailable in this simulation.',
    'A form field may have stopped the page from continuing.',
    'The confirmation redirect may not have happened.',
  ],
  seriousness: 'This is serious for a store. In the simulation, customers would not see an order confirmation.',
  nextSteps: [
    'Open the checkout issue and read the observed step.',
    'Compare it with the confirmation page you expect.',
    'When you monitor a real test environment, use a test account and never a live card.',
  ],
  technical: [
    'Simulated expected URL: /checkout/confirmation',
    'Simulated observed URL: /checkout',
    'Confirmation marker: not found',
    'No purchase was attempted. This is tutorial data.',
  ],
}

const formExplanation: Explanation = {
  whatHappened: 'The contact form opened successfully, but the expected confirmation was not detected.',
  why: [
    'The form submission may have failed.',
    'The confirmation message may not have appeared.',
    'The form may require an additional field.',
    'Email delivery was not checked, so an inbox problem is only a possible explanation.',
  ],
  seriousness: 'Customers may think their message was not received. This simulated issue is a warning, not a site outage.',
  nextSteps: ['Submit a test message and check whether it reaches your inbox.'],
  technical: [
    'Simulated form URL: /contact',
    'Expected confirmation: “Thanks, we received your message.”',
    'Observed: the page stayed on /contact',
    'Email delivery: not verified',
  ],
}

const linkExplanation: Explanation = {
  whatHappened: 'The summer collection page could not be reached from the products page.',
  why: [
    'The link may point to a page that was removed.',
    'The address may have a typo.',
    'The page may have moved without a redirect.',
  ],
  seriousness: 'Shoppers who follow this link would not see the collection. Other pages in the simulation still respond.',
  nextSteps: ['Open the link details and note the missing path.', 'On a real site, fix or redirect that address before the next check.'],
  technical: ['Simulated source: /products', 'Simulated destination: /products/summer-collection', 'Simulated HTTP status: 404'],
}

const uptimeExplanation: Explanation = {
  whatHappened: 'The demo store stopped responding, then recovered 43 minutes later.',
  why: ['The simulated server did not answer during the incident window.'],
  seriousness: 'The outage is over in this tutorial. It is kept in the history so you can see a recovered incident.',
  nextSteps: ['Review the incident timeline.', 'Notice that recovery did not automatically close the checkout or form issues.'],
  technical: ['Simulated detection: no successful response', 'Simulated duration: 43 minutes', 'Final uptime status: healthy'],
}

const bookingExplanation: Explanation = {
  whatHappened: 'The booking page was slow to load, then later loaded successfully.',
  why: ['The simulated page exceeded the usual response time, then returned to normal.'],
  seriousness: 'This one is resolved. It is an example of an issue that no longer needs action.',
  nextSteps: ['Compare it with an active issue to see the difference in status.'],
  technical: ['Simulated slow response, then HTTP 200', 'Current simulated status: healthy'],
}

export const DEMO_ISSUES: Issue[] = [
  {
    id: ISSUE_CHECKOUT,
    websiteId: DEMO_WEBSITE_ID,
    title: 'Checkout did not reach confirmation',
    pageName: 'Checkout',
    pagePath: '/checkout',
    severity: 'critical',
    status: 'active',
    category: 'checkout',
    detectedAt: ago(26),
    description: 'The simulated checkout workflow stopped before the confirmation page.',
    whatHappened: 'Web Wrench detected that the checkout workflow did not complete successfully.',
    currentStatus: 'Still open in the tutorial. No order was placed.',
    investigation: [
      'Look at which step failed.',
      'Read the difference between the observed page and the expected confirmation.',
      'Use Explain with AI for a plain-language summary.',
    ],
    observed: 'The flow reached Checkout and did not arrive at Confirmation.',
    expected: 'A completed tutorial checkout would show the confirmation page.',
    monitoringResult: 'Simulated checkout failed before confirmation. No purchase was made.',
    technical: [
      { label: 'Expected step', value: 'Confirmation' },
      { label: 'Last step reached', value: 'Checkout' },
      { label: 'HTTP status of checkout page', value: '200' },
      { label: 'Purchase', value: 'Not attempted' },
    ],
    isDemo: true,
    explanation: checkoutExplanation,
  },
  {
    id: ISSUE_FORM,
    websiteId: DEMO_WEBSITE_ID,
    title: 'Contact form submission could not be verified',
    pageName: 'Contact form',
    pagePath: '/contact',
    severity: 'warning',
    status: 'active',
    category: 'form',
    detectedAt: ago(14),
    description: 'The form page opened, but the expected thank-you message did not appear.',
    whatHappened: 'The contact form opened successfully, but the expected confirmation was not detected.',
    currentStatus: 'Open warning. Email delivery was not tested.',
    investigation: [
      'Separate what was observed from what might have caused it.',
      'Send a test message on a real site and check the inbox yourself.',
    ],
    observed: 'The page stayed on /contact. The thank-you message was not detected.',
    expected: 'A successful test would show “Thanks, we received your message.”',
    monitoringResult: 'Simulated form confirmation was not detected. Email delivery was not verified.',
    technical: [
      { label: 'Form URL', value: '/contact' },
      { label: 'Expected confirmation', value: 'Thanks, we received your message.' },
      { label: 'Observed page', value: '/contact' },
      { label: 'Email delivery', value: 'Not verified' },
    ],
    isDemo: true,
    explanation: formExplanation,
  },
  {
    id: ISSUE_LINK,
    websiteId: DEMO_WEBSITE_ID,
    title: 'Broken link on the summer collection',
    pageName: 'Summer collection',
    pagePath: '/products/summer-collection',
    severity: 'warning',
    status: 'active',
    category: 'link',
    detectedAt: ago(62),
    description: 'This page could not be reached. Customers may not be able to access it.',
    whatHappened: 'A link from the products page points to a summer collection page that returned a not-found result.',
    currentStatus: 'Open warning in the simulation.',
    investigation: ['Open the link details.', 'Note the source page and the missing destination.'],
    observed: '/products/summer-collection could not be reached.',
    expected: 'The collection page would load for shoppers.',
    monitoringResult: 'Simulated link check returned HTTP 404.',
    technical: [
      { label: 'Source', value: '/products' },
      { label: 'Destination', value: '/products/summer-collection' },
      { label: 'HTTP status', value: '404' },
    ],
    isDemo: true,
    explanation: linkExplanation,
  },
  {
    id: ISSUE_UPTIME,
    websiteId: DEMO_WEBSITE_ID,
    title: 'Website was temporarily unavailable',
    pageName: 'Homepage',
    pagePath: '/',
    severity: 'critical',
    status: 'resolved',
    category: 'uptime',
    detectedAt: ago(60 * 5),
    description: 'The demo store did not respond, then recovered.',
    whatHappened: 'Web Wrench detected that the website did not respond successfully.',
    currentStatus: 'Recovered. The site is responding in the simulation.',
    investigation: ['Read the incident duration and the recovery time.', 'Keep this separate from issues that are still open.'],
    observed: 'Checks failed for 43 minutes, then the homepage responded again.',
    expected: 'The homepage responds to a check.',
    monitoringResult: 'Simulated outage lasted 43 minutes and is now resolved.',
    technical: [
      { label: 'Duration', value: '43 minutes' },
      { label: 'Recovery', value: 'Homepage responding' },
      { label: 'Final status', value: 'Healthy' },
    ],
    isDemo: true,
    explanation: uptimeExplanation,
  },
  {
    id: ISSUE_BOOKING,
    websiteId: DEMO_WEBSITE_ID,
    title: 'Booking page loaded slowly',
    pageName: 'Booking',
    pagePath: '/booking',
    severity: 'warning',
    status: 'resolved',
    category: 'page',
    detectedAt: ago(60 * 20),
    description: 'The booking page recovered after a slow response.',
    whatHappened: 'The booking page took too long to load, then succeeded on a later check.',
    currentStatus: 'Resolved. The latest simulated check loaded the page.',
    investigation: ['Use this as an example of a resolved warning.'],
    observed: 'A later check loaded the booking page successfully.',
    expected: 'The booking page loads for visitors.',
    monitoringResult: 'Simulated booking page is healthy again.',
    technical: [{ label: 'Latest simulated result', value: 'Page loaded' }],
    isDemo: true,
    explanation: bookingExplanation,
  },
]

export const DEMO_LINKS: LinkCheck[] = [
  {
    id: 'link-summer',
    source: '/products',
    destination: '/products/summer-collection',
    status: 'broken',
    httpStatus: 404,
    lastChecked: ago(62),
    description: 'This page could not be reached. Customers may not be able to access it.',
    issueId: ISSUE_LINK,
  },
  {
    id: 'link-home',
    source: '/',
    destination: '/products',
    status: 'ok',
    httpStatus: 200,
    lastChecked: ago(8),
    description: 'The products link responded in the simulation.',
  },
  {
    id: 'link-contact',
    source: '/',
    destination: '/contact',
    status: 'ok',
    httpStatus: 200,
    lastChecked: ago(8),
    description: 'The contact page link responded. The form issue is tracked separately.',
  },
  {
    id: 'link-booking',
    source: '/',
    destination: '/booking',
    status: 'ok',
    httpStatus: 200,
    lastChecked: ago(18),
    description: 'The booking page link responded.',
  },
  {
    id: 'link-blog',
    source: '/blog',
    destination: '/blog/spring-lookbook',
    status: 'redirect',
    httpStatus: 301,
    lastChecked: ago(40),
    description: 'This old post redirects to the current lookbook. A redirect is not a broken link.',
  },
  {
    id: 'link-about',
    source: '/',
    destination: '/about',
    status: 'ok',
    httpStatus: 200,
    lastChecked: ago(40),
    description: 'The about page link responded.',
  },
  {
    id: 'link-faq',
    source: '/',
    destination: '/faq',
    status: 'ok',
    httpStatus: 200,
    lastChecked: ago(40),
    description: 'The FAQ link responded.',
  },
  {
    id: 'link-shipping',
    source: '/checkout',
    destination: '/shipping',
    status: 'ok',
    httpStatus: 200,
    lastChecked: ago(26),
    description: 'The shipping policy link responded. Checkout itself is a separate issue.',
  },
]

export const DEMO_PAGES: PageSnapshot[] = [
  { id: 'home', name: 'Homepage', path: '/', frequency: '5m', status: 'healthy', detail: 'Responding normally in the simulation.', lastChecked: ago(2), simulated: true },
  { id: 'products', name: 'Products', path: '/products', frequency: '15m', status: 'healthy', detail: 'The catalog page loaded.', lastChecked: ago(8), simulated: true },
  { id: 'summer', name: 'Summer collection', path: '/products/summer-collection', frequency: '15m', status: 'warning', detail: 'This important page could not be reached.', lastChecked: ago(62), simulated: true },
  { id: 'contact', name: 'Contact', path: '/contact', frequency: '15m', status: 'warning', detail: 'The page loads, but the form confirmation was not detected.', lastChecked: ago(14), simulated: true },
  { id: 'booking', name: 'Booking', path: '/booking', frequency: '15m', status: 'healthy', detail: 'Page loaded successfully.', lastChecked: ago(18), simulated: true },
  { id: 'cart', name: 'Cart', path: '/cart', frequency: '15m', status: 'healthy', detail: 'The cart page loaded.', lastChecked: ago(26), simulated: true },
  { id: 'checkout', name: 'Checkout', path: '/checkout', frequency: '5m', status: 'critical', detail: 'The workflow did not reach confirmation.', lastChecked: ago(26), simulated: true },
  { id: 'about', name: 'About', path: '/about', frequency: '1h', status: 'healthy', detail: 'The about page loaded.', lastChecked: ago(40), simulated: true },
  { id: 'faq', name: 'FAQ', path: '/faq', frequency: '1h', status: 'healthy', detail: 'The FAQ page loaded.', lastChecked: ago(40), simulated: true },
  { id: 'account', name: 'Account', path: '/account', frequency: '1h', status: 'healthy', detail: 'The account page loaded.', lastChecked: ago(50), simulated: true },
  { id: 'shipping', name: 'Shipping', path: '/shipping', frequency: '6h', status: 'healthy', detail: 'The shipping page loaded.', lastChecked: ago(50), simulated: true },
  { id: 'blog', name: 'Blog', path: '/blog', frequency: '6h', status: 'healthy', detail: 'The blog page loaded.', lastChecked: ago(50), simulated: true },
]

export const DEMO_FORMS: FormSnapshot[] = [
  {
    id: 'contact-form',
    name: 'Contact form',
    url: 'https://demo-store.webwrench.app/contact',
    expectedConfirmation: 'Thanks, we received your message.',
    notes: 'Tutorial form. No message is sent.',
    status: 'warning',
    lastTest: ago(14),
    result: 'Form submission could not be verified.',
    observed: [
      'The form page opened.',
      'The expected confirmation did not appear.',
      'Email delivery was not verified.',
    ],
    possibleCauses: [
      'The form submission failed.',
      'The confirmation message did not appear.',
      'The form may require an additional field.',
      'The email delivery system may not have responded. This was not verified.',
    ],
    simulated: true,
  },
]

export const DEMO_CHECKOUT_STEPS: CheckoutStep[] = [
  { name: 'Product page', state: 'passed', detail: 'The product page loaded.' },
  { name: 'Cart', state: 'passed', detail: 'The item appeared in the cart.' },
  { name: 'Checkout', state: 'failed', detail: 'The checkout page opened, but the flow did not continue.' },
  { name: 'Confirmation', state: 'not_reached', detail: 'The confirmation page was not detected.' },
]

export function demoUptimeSeries(): UptimePoint[] {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  return Array.from({ length: 24 }, (_, index) => {
    const hoursAgo = 23 - index
    const time = new Date(now.getTime() - hoursAgo * 3_600_000)
    const down = hoursAgo === 5
    return {
      label: time.toLocaleTimeString(undefined, { hour: 'numeric' }),
      responseMs: down ? null : 150 + ((index * 37) % 90),
      up: !down,
    }
  })
}

export const DEMO_UPTIME_EVENTS: TimelineEvent[] = [
  { time: '5 hours ago', title: 'Check started', detail: 'Web Wrench asked the homepage to respond.', tone: 'unknown' },
  { time: '5 hours ago', title: 'No successful response', detail: 'The website did not respond successfully.', tone: 'critical' },
  { time: '5 hours ago', title: 'Incident opened', detail: 'Your website is temporarily unavailable.', tone: 'critical' },
  { time: '4 hours ago', title: 'Website recovered', detail: 'The homepage responded again after 43 minutes.', tone: 'healthy' },
]

export const DEMO_INCIDENTS: Incident[] = [
  {
    id: 'incident-uptime',
    title: 'Homepage did not respond',
    startedAt: ago(60 * 5),
    recoveredAt: ago(60 * 5 - 43),
    duration: '43 minutes',
    status: 'resolved',
    summary: 'The simulated website was unavailable and then recovered.',
    events: DEMO_UPTIME_EVENTS,
  },
  {
    id: 'incident-checkout',
    title: 'Checkout missed confirmation',
    startedAt: ago(26),
    recoveredAt: null,
    duration: 'Ongoing',
    status: 'ongoing',
    summary: 'The checkout workflow still does not reach confirmation.',
    events: [
      { time: '26 minutes ago', title: 'Checkout check started', detail: 'The tutorial followed product, cart, and checkout.', tone: 'unknown' },
      { time: '26 minutes ago', title: 'Confirmation missing', detail: 'The expected confirmation page did not appear.', tone: 'critical' },
    ],
  },
]

export function activityFrom(issues: Issue[]): ActivityItem[] {
  const byId = new Map(issues.map((issue) => [issue.id, issue]))
  const form = byId.get(ISSUE_FORM)
  const checkout = byId.get(ISSUE_CHECKOUT)
  const link = byId.get(ISSUE_LINK)
  return [
    {
      id: 'activity-home',
      pageName: 'Homepage',
      description: 'Website is responding',
      status: 'healthy',
      timestamp: ago(2),
      href: '/monitoring/uptime',
    },
    {
      id: 'activity-form',
      pageName: 'Contact form',
      description: form?.status === 'resolved' ? 'Marked resolved in this demo' : 'Submission could not be verified',
      status: form?.status === 'resolved' ? 'healthy' : 'warning',
      timestamp: ago(14),
      href: `/issues/${ISSUE_FORM}`,
    },
    {
      id: 'activity-booking',
      pageName: 'Booking page',
      description: 'Page loaded successfully',
      status: 'healthy',
      timestamp: ago(18),
      href: '/monitoring/pages',
    },
    {
      id: 'activity-checkout',
      pageName: 'Checkout',
      description: checkout?.status === 'resolved' ? 'Marked resolved in this demo' : 'Checkout did not reach confirmation',
      status: checkout?.status === 'resolved' ? 'healthy' : 'critical',
      timestamp: ago(26),
      href: `/issues/${ISSUE_CHECKOUT}`,
    },
    {
      id: 'activity-link',
      pageName: 'Summer collection',
      description: link?.status === 'resolved' ? 'Marked resolved in this demo' : 'Broken link',
      status: link?.status === 'resolved' ? 'healthy' : 'warning',
      timestamp: ago(62),
      href: `/issues/${ISSUE_LINK}`,
    },
  ]
}

export const TUTORIAL_PAGE_CHOICES = [
  { id: 'home', name: 'Homepage', path: '/' },
  { id: 'products', name: 'Products', path: '/products' },
  { id: 'contact', name: 'Contact', path: '/contact' },
  { id: 'booking', name: 'Booking', path: '/booking' },
]

export function demoAssistantReply(question: string, issueTitle?: string) {
  const text = question.toLowerCase()
  const intro = 'In this tutorial simulation'
  if (text.includes('first') || text.includes('investigate')) {
    return `${intro}, start with checkout. Shoppers would not see an order confirmation. The contact form is a warning, and the summer collection link is broken, but checkout blocks a purchase. No real order was placed.`
  }
  if (text.includes('form') || text.includes('contact')) {
    return `${intro}, the contact form opened, but the thank-you message was not detected. That is an observation. Possible reasons include a failed submission, a missing confirmation, or an extra required field. Email delivery was not verified.`
  }
  if (text.includes('uptime') || text.includes('offline') || text.includes('down')) {
    return `${intro}, the store did not respond for 43 minutes and then recovered. The 99.9% figure is the simulated 30-day uptime. The chart’s dip is that outage. The site is responding again, while checkout and the contact form are still open.`
  }
  if (text.includes('link') || text.includes('summer') || text.includes('404')) {
    return `${intro}, /products/summer-collection could not be reached from the products page. The simulated result is HTTP 404. Shoppers using that link would not see the collection.`
  }
  if (text.includes('checkout') || text.includes('payment') || text.includes('cart')) {
    return `${intro}, the path went from the product page to the cart to checkout, then stopped. The confirmation page was not detected. Possible reasons include an unavailable payment step, a form error, or a failed redirect. No purchase was made.`
  }
  if (text.includes('simple') || text.includes('english') || text.includes('mean')) {
    return issueTitle
      ? `${intro}, “${issueTitle}” means Web Wrench saw a result that did not match the expected page or confirmation. It is practice data for demo-store.webwrench.app, not a live incident on your website.`
      : `${intro}, the store is online, but checkout, the contact form, and one product link still need attention. Nothing here is a live check of a real website.`
  }
  if (text.includes('health') || text.includes('how is') || text.includes('status')) {
    return `${intro}, Northwind Demo Store is online after a 43-minute outage. Three simulated issues are still open unless you marked them resolved: checkout, the contact form, and the summer collection link. Uptime for the fictional 30-day period is 99.9%.`
  }
  return `${intro}, I can explain the demo store only. Ask about website health, the contact form, uptime, the broken summer collection link, or which issue to open first. I do not have live results for a real website.`
}
