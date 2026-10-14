const getSelectorValue = value => {
  const stringValue = String(value);

  return globalThis.CSS?.escape ? globalThis.CSS.escape(stringValue) : stringValue.replace(/"/g, '\\"');
};

const getTabsGroup = groupName => {
  if (typeof Element !== 'undefined' && groupName instanceof Element) return groupName;

  return document.querySelector(`[data-tabs="${getSelectorValue(groupName)}"]`);
};

const getGroupItems = (tabsGroup, selector) => {
  return Array.from(tabsGroup.querySelectorAll(selector)).filter(item => item.closest('[data-tabs]') === tabsGroup);
};

const getActiveTab = tabsGroup => {
  return getGroupItems(tabsGroup, '[data-tab]').find(item => item.classList.contains('active'));
};

const setActiveButton = (tabsGroup, tabName) => {
  getGroupItems(tabsGroup, '[data-tab-target]').forEach(button => {
    button.classList.toggle('active', button.dataset.tabTarget === tabName);
  });
};

const FIELD_SELECTOR = 'input, select, textarea';
const INACTIVE_TAB_SELECTOR = '[data-tab]:not(.active)';

// Поля закрытых панелей отключаются: скрытое поле иначе продолжает проверяться и уходит с формой.
// disabled ставится самим полям (у div такого атрибута нет), а отключённое нами поле помечается,
// чтобы при открытии панели не включить то, что было отключено в разметке или другим скриптом
const syncTabFields = tabsGroup => {
  tabsGroup.querySelectorAll(FIELD_SELECTOR).forEach(field => {
    if (!field.closest('[data-tab]')) return;

    // Учитываются и вложенные группы: поле отключено, пока закрыта хотя бы одна панель над ним
    if (field.closest(INACTIVE_TAB_SELECTOR)) {
      if (field.disabled) return;

      field.disabled = true;
      field.dataset.tabDisabled = '';
    } else if ('tabDisabled' in field.dataset) {
      field.disabled = false;
      delete field.dataset.tabDisabled;
    }
  });
};

const getActiveButtonName = tabsGroup => {
  return getGroupItems(tabsGroup, '[data-tab-target]').find(button => button.classList.contains('active'))?.dataset.tabTarget;
};

// Панелей с одним именем в группе может быть несколько — они открываются и закрываются вместе.
// Стартовая вкладка берётся с активной кнопки, без неё — с активной или первой панели.
// У вкладки может не быть своих панелей (например, у физлица нет доп. полей) — тогда закрыты все панели группы
const ensureActiveTab = tabsGroup => {
  const tabs = getGroupItems(tabsGroup, '[data-tab]');
  const activeName = getActiveButtonName(tabsGroup) ?? (tabs.find(tab => tab.classList.contains('active')) || tabs[0])?.dataset.tab;

  if (activeName === undefined) return null;

  const activeTab = tabs.find(tab => tab.dataset.tab === activeName) || null;

  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === activeName);
  });

  setActiveButton(tabsGroup, activeName);
  syncTabFields(tabsGroup);

  return activeTab;
};

const TAB_FADE_DURATION = 300;
// <… data-tabs="имя" data-unanimated> — панели этой группы меняются сразу, без затухания и появления
const UNANIMATED_ATTRIBUTE = 'data-unanimated';
// Последняя запрошенная вкладка группы: при быстрых кликах подряд открывается только она
const requestedTabs = new WeakMap();

// Ждём, пока панель погаснет. Таймер — на случай, если transitionend не придёт
// (панель лежит в скрытом блоке или уже прозрачна)
const waitForFade = element =>
  new Promise(resolve => {
    const done = () => {
      element.removeEventListener('transitionend', done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, TAB_FADE_DURATION + 50);

    element.addEventListener('transitionend', done);
  });

export const openTab = async (groupName, tabName) => {
  const tabsGroup = getTabsGroup(groupName);

  if (!tabsGroup || tabName === undefined || tabName === null) return;

  const name = String(tabName);
  const tabs = getGroupItems(tabsGroup, '[data-tab]');
  const targetTabs = tabs.filter(item => item.dataset.tab === name);
  const activeTabs = tabs.filter(item => item.classList.contains('active'));
  const hasButton = getGroupItems(tabsGroup, '[data-tab-target]').some(button => button.dataset.tabTarget === name);
  const currentName = requestedTabs.get(tabsGroup) ?? getActiveButtonName(tabsGroup) ?? activeTabs[0]?.dataset.tab;

  // Неизвестное имя (нет ни панели, ни кнопки) игнорируем, чтобы случайно не закрыть все панели
  if ((targetTabs.length === 0 && !hasButton) || currentName === name) return;

  const isAnimated = !tabsGroup.hasAttribute(UNANIMATED_ATTRIBUTE);

  requestedTabs.set(tabsGroup, name);
  setActiveButton(tabsGroup, name);

  if (isAnimated && activeTabs.length > 0) {
    activeTabs.forEach(tab => {
      tab.style.opacity = '0';
    });

    await waitForFade(activeTabs[0]);

    // Пока панели гасли, выбрали другую вкладку — её откроет свой вызов
    if (requestedTabs.get(tabsGroup) !== name) return;
  }

  tabs.forEach(tab => {
    if (tab.dataset.tab !== name) tab.classList.remove('active');
  });

  targetTabs.forEach(tab => {
    tab.style.opacity = isAnimated ? '0' : '';
    tab.classList.add('active');
  });

  syncTabFields(tabsGroup);

  if (!isAnimated) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      targetTabs.forEach(tab => {
        tab.style.opacity = '1';
      });
    });
  });
};

export const initTabs = () => {
  const tabsGroups = Array.from(document.querySelectorAll('[data-tabs]'));

  if (tabsGroups.length === 0) return;

  tabsGroups.forEach(tabsGroup => {
    ensureActiveTab(tabsGroup);

    const tabButtons = getGroupItems(tabsGroup, '[data-tab-target]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => openTab(tabsGroup, btn.dataset.tabTarget));
    });
  });
};

if (typeof window !== 'undefined') {
  window.openTab = openTab;
}
