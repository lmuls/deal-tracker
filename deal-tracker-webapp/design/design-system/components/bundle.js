/* @ds-bundle: {"format":4,"namespace":"DealTracker","components":[{"name":"Button"},{"name":"DealBadge"},{"name":"TrackerCard"},{"name":"NotificationRow"},{"name":"TextField"},{"name":"Switch"},{"name":"ChoiceChips"},{"name":"AddTrackerForm"},{"name":"AuthCard"},{"name":"StatTile"},{"name":"EmptyState"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }

  /* Button ---------------------------------------------------------- */
  function Button(props) {
    var variant = props.variant || 'secondary';
    var size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'className', 'children', 'icon']);
    if (!rest.type) rest.type = 'button';
    rest.className = cx('dt-btn', 'dt-btn--' + variant, 'dt-btn--' + size, props.className);
    return h('button', rest,
      props.icon ? h('span', { className: 'dt-btn__icon', 'aria-hidden': 'true' }, props.icon) : null,
      props.children);
  }

  /* DealBadge ------------------------------------------------------- */
  function DealBadge(props) {
    var tone = props.tone || 'deal';
    return h('span', { className: cx('dt-badge', 'dt-badge--' + tone, props.className) },
      props.dot ? h('span', { className: 'dt-badge__dot', 'aria-hidden': 'true' }) : null,
      props.children);
  }

  /* TrackerCard ----------------------------------------------------- */
  var STATUS = {
    watching: { tone: 'watching', label: 'Watching' },
    deal: { tone: 'deal', label: 'Offer live' },
    paused: { tone: 'paused', label: 'Paused' }
  };

  function TrackerCard(props) {
    var status = props.status || 'watching';
    var s = STATUS[status] || STATUS.watching;
    var initial = (props.store || '?').trim().charAt(0).toUpperCase();
    var paused = status === 'paused';

    return h('article', { className: cx('dt-card', 'dt-card--' + status, props.className) },
      h('div', { className: 'dt-card__head' },
        h('div', { className: 'dt-card__logo', 'aria-hidden': 'true' },
          props.logo ? h('img', { src: props.logo, alt: '' }) : initial),
        h('div', { className: 'dt-card__id' },
          h('h3', { className: 'dt-card__store' }, props.store),
          props.url ? h('p', { className: 'dt-card__url' }, props.url) : null)),

      h('div', { className: 'dt-card__status' },
        h(DealBadge, { tone: s.tone, dot: status !== 'paused' }, s.label),
        props.lastChecked ? h('span', { className: 'dt-card__checked' }, props.lastChecked) : null),

      status === 'deal' && props.deal ? h('div', { className: 'dt-card__deal' },
        h('p', { className: 'dt-card__deal-title' }, props.deal.title),
        props.deal.detail ? h('p', { className: 'dt-card__deal-detail' }, props.deal.detail) : null) : null,

      props.watchFor ? h('p', { className: 'dt-card__watch' },
        h('span', { className: 'dt-card__watch-label' }, 'Watching for'), ' ', props.watchFor) : null,

      (props.onTogglePause || (status === 'deal' && props.onViewOffer)) ? h('div', { className: 'dt-card__foot' },
        props.onTogglePause ? h(Button, { variant: 'quiet', size: 'sm', onClick: props.onTogglePause }, paused ? 'Resume' : 'Pause') : null,
        status === 'deal' && props.onViewOffer ? h(Button, { variant: 'primary', size: 'sm', onClick: props.onViewOffer }, 'View offer') : null) : null);
  }

  /* NotificationRow ------------------------------------------------- */
  function NotificationRow(props) {
    var unread = !!props.unread;
    var Tag = props.href ? 'a' : (props.onClick ? 'button' : 'div');
    var attrs = { className: cx('dt-notif', unread ? 'dt-notif--unread' : null, props.className) };
    if (props.href) attrs.href = props.href;
    if (props.onClick) { attrs.onClick = props.onClick; if (Tag === 'button') attrs.type = 'button'; }

    return h(Tag, attrs,
      h('span', { className: 'dt-notif__dot', 'aria-hidden': 'true' }),
      h('span', { className: 'dt-notif__body' },
        h('span', { className: 'dt-notif__store' }, props.store),
        h('span', { className: 'dt-notif__msg' }, props.message)),
      h('span', { className: 'dt-notif__meta' },
        props.badge ? h(DealBadge, { tone: unread ? 'deal' : 'soft' }, props.badge) : null,
        h('span', { className: 'dt-notif__time' }, props.time)),
      unread ? h('span', { className: 'dt-sr' }, ' (unread)') : null);
  }

  var uid = 0;
  function useId(given) {
    var ref = React.useRef(null);
    if (ref.current === null) ref.current = given || ('dt-' + (++uid));
    return ref.current;
  }

  /* TextField ------------------------------------------------------- */
  function TextField(props) {
    var id = useId(props.id);
    var input = omit(props, ['label', 'hint', 'error', 'className', 'id', 'prefix']);
    input.id = id;
    input.className = 'dt-field__input';
    if (!input.type) input.type = 'text';
    if (props.error) input['aria-invalid'] = 'true';
    if (props.hint || props.error) input['aria-describedby'] = id + '-msg';
    return h('div', { className: cx('dt-field', props.error ? 'dt-field--error' : null, props.className) },
      props.label ? h('label', { className: 'dt-field__label', htmlFor: id }, props.label) : null,
      h('div', { className: 'dt-field__box' },
        props.prefix ? h('span', { className: 'dt-field__prefix' }, props.prefix) : null,
        h('input', input)),
      (props.error || props.hint) ? h('p', { id: id + '-msg', className: 'dt-field__msg' }, props.error || props.hint) : null);
  }

  /* Switch ---------------------------------------------------------- */
  function Switch(props) {
    var id = useId(props.id);
    var controlled = props.checked !== undefined;
    var st = React.useState(!!props.defaultChecked);
    var on = controlled ? !!props.checked : st[0];
    function toggle() {
      if (props.disabled) return;
      if (!controlled) st[1](!on);
      if (props.onChange) props.onChange(!on);
    }
    return h('div', { className: cx('dt-switch', props.disabled ? 'dt-switch--disabled' : null, props.className) },
      h('button', { type: 'button', role: 'switch', id: id, 'aria-checked': on ? 'true' : 'false',
        'aria-labelledby': props.label ? id + '-l' : undefined, disabled: props.disabled,
        className: cx('dt-switch__track', on ? 'is-on' : null), onClick: toggle },
        h('span', { className: 'dt-switch__thumb' })),
      (props.label || props.description) ? h('div', { className: 'dt-switch__text' },
        props.label ? h('label', { id: id + '-l', htmlFor: id, className: 'dt-switch__label' }, props.label) : null,
        props.description ? h('span', { className: 'dt-switch__desc' }, props.description) : null) : null);
  }

  /* ChoiceChips (internal, also exported) --------------------------- */
  function ChoiceChips(props) {
    return h('div', { className: 'dt-chips', role: 'radiogroup', 'aria-label': props.label },
      props.options.map(function (o) {
        var sel = o.value === props.value;
        return h('button', { key: o.value, type: 'button', role: 'radio', 'aria-checked': sel ? 'true' : 'false',
          className: cx('dt-chip', sel ? 'is-selected' : null),
          onClick: function () { if (props.onChange) props.onChange(o.value); } }, o.label);
      }));
  }

  /* AddTrackerForm -------------------------------------------------- */
  var WATCH = [
    { value: 'campaign', label: 'Any campaign' },
    { value: 'price', label: 'Price drop' },
    { value: 'keyword', label: 'Keyword' },
    { value: 'shipping', label: 'Free shipping' }
  ];
  var FREQ = [
    { value: '15m', label: '15 min' },
    { value: '30m', label: '30 min' },
    { value: '1h', label: 'Hourly' },
    { value: '1d', label: 'Daily' }
  ];

  function AddTrackerForm(props) {
    var init = props.defaultValues || {};
    var s = React.useState({
      url: init.url || '', watch: init.watch || 'campaign', keyword: init.keyword || '',
      frequency: init.frequency || '30m', email: init.email !== false, push: !!init.push
    });
    var v = s[0];
    function set(k) { return function (x) { var n = Object.assign({}, v); n[k] = x && x.target ? x.target.value : x; s[1](n); }; }
    function submit(e) { e.preventDefault(); if (props.onSubmit) props.onSubmit(v); }

    return h('form', { className: cx('dt-form', props.className), onSubmit: submit },
      h('div', { className: 'dt-form__head' },
        h('h3', { className: 'dt-form__title' }, props.title || 'Track a new site'),
        h('p', { className: 'dt-form__sub' }, 'Paste a store or page and choose what counts as a deal.')),
      h(TextField, { label: 'Website or page', placeholder: 'nordicoutdoor.se/jackets', prefix: 'https://', value: v.url, onChange: set('url'), required: true }),
      h('div', { className: 'dt-form__group' },
        h('span', { className: 'dt-field__label' }, 'Watch for'),
        h(ChoiceChips, { label: 'Watch for', options: WATCH, value: v.watch, onChange: set('watch') })),
      v.watch === 'keyword' ? h(TextField, { label: 'Keyword', placeholder: 'e.g. Black Friday, rea, outlet', value: v.keyword, onChange: set('keyword'), hint: 'We alert you when this appears on the page.' }) : null,
      h('div', { className: 'dt-form__group' },
        h('span', { className: 'dt-field__label' }, 'Check every'),
        h(ChoiceChips, { label: 'Check every', options: FREQ, value: v.frequency, onChange: set('frequency') })),
      h('div', { className: 'dt-form__group dt-form__switches' },
        h(Switch, { label: 'Email', description: 'One message per new offer', checked: v.email, onChange: set('email') }),
        h(Switch, { label: 'Push notification', description: 'Instant, on this device', checked: v.push, onChange: set('push') })),
      h('div', { className: 'dt-form__actions' },
        props.onCancel ? h(Button, { variant: 'quiet', onClick: props.onCancel }, 'Cancel') : null,
        h(Button, { variant: 'primary', type: 'submit' }, props.submitLabel || 'Start tracking')));
  }

  /* EmptyState ------------------------------------------------------ */
  function EmptyState(props) {
    return h('div', { className: cx('dt-empty', props.className) },
      h('div', { className: 'dt-empty__mark', 'aria-hidden': 'true' },
        h('span', { className: 'dt-empty__ring dt-empty__ring--3' }),
        h('span', { className: 'dt-empty__ring dt-empty__ring--2' }),
        h('span', { className: 'dt-empty__core' })),
      h('h3', { className: 'dt-empty__title' }, props.title),
      props.body ? h('p', { className: 'dt-empty__body' }, props.body) : null,
      props.action ? h('div', { className: 'dt-empty__action' }, props.action) : null);
  }

  /* StatTile -------------------------------------------------------- */
  function StatTile(props) {
    return h('div', { className: cx('dt-stat', props.tone === 'deal' ? 'dt-stat--deal' : null, props.className) },
      h('span', { className: 'dt-stat__value' }, props.value),
      h('span', { className: 'dt-stat__label' }, props.label),
      props.detail ? h('span', { className: 'dt-stat__detail' }, props.detail) : null);
  }

  /* AuthCard -------------------------------------------------------- */
  function AuthCard(props) {
    var s = React.useState(props.defaultMode || 'register');
    var mode = s[0];
    var reg = mode === 'register';
    function submit(e) { e.preventDefault(); if (props.onSubmit) props.onSubmit(mode, e); }
    return h('div', { className: cx('dt-auth', props.className) },
      h('div', { className: 'dt-auth__tabs', role: 'tablist' },
        h('button', { type: 'button', role: 'tab', 'aria-selected': reg ? 'true' : 'false', className: cx('dt-auth__tab', reg ? 'is-active' : null), onClick: function () { s[1]('register'); } }, 'Create account'),
        h('button', { type: 'button', role: 'tab', 'aria-selected': reg ? 'false' : 'true', className: cx('dt-auth__tab', reg ? null : 'is-active'), onClick: function () { s[1]('login'); } }, 'Log in')),
      h('form', { className: 'dt-auth__form', onSubmit: submit },
        reg ? h(TextField, { label: 'Name', placeholder: 'Your name', autoComplete: 'name' }) : null,
        h(TextField, { label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' }),
        h(TextField, { label: 'Password', type: 'password', placeholder: reg ? 'At least 8 characters' : '••••••••', autoComplete: reg ? 'new-password' : 'current-password' }),
        reg ? null : h('a', { className: 'dt-auth__link', href: props.forgotHref || '#' }, 'Forgot password?'),
        h(Button, { variant: 'primary', type: 'submit', className: 'dt-auth__submit' }, reg ? 'Create free account' : 'Log in'),
        h('p', { className: 'dt-auth__fine' }, reg ? 'Free for up to 5 trackers. No card needed.' : 'Welcome back. Your trackers kept watching.')));
  }

  var ns = window.DealTracker || (window.DealTracker = {});
  ns.TextField = TextField;
  ns.Switch = Switch;
  ns.ChoiceChips = ChoiceChips;
  ns.AddTrackerForm = AddTrackerForm;
  ns.EmptyState = EmptyState;
  ns.StatTile = StatTile;
  ns.AuthCard = AuthCard;
  ns.Button = Button;
  ns.DealBadge = DealBadge;
  ns.TrackerCard = TrackerCard;
  ns.NotificationRow = NotificationRow;
})();
