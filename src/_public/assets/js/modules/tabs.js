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

const ensureActiveTab = tabsGroup => {
  const tabs = getGroupItems(tabsGroup, '[data-tab]');

  if (tabs.length === 0) return null;

  const activeTabs = tabs.filter(tab => tab.classList.contains('active'));
  const activeTab = activeTabs[0] || tabs[0];

  tabs.forEach(tab => {
    tab.classList.toggle('active', tab === activeTab);
  });

  setActiveButton(tabsGroup, activeTab.dataset.tab);

  return activeTab;
};

export const openTab = (groupName, tabName) => {
  const tabsGroup = getTabsGroup(groupName);

  if (!tabsGroup || tabName === undefined || tabName === null) return;

  const buttons = getGroupItems(tabsGroup, '[data-tab-target]');
  const tabs = getGroupItems(tabsGroup, '[data-tab]');
  const button = buttons.find(item => item.dataset.tabTarget === String(tabName));
  const targetTab = tabs.find(item => item.dataset.tab === String(tabName));
  const activeTab = tabs.find(item => item.classList.contains('active'));

  if (!targetTab || targetTab === activeTab) return;

  const showNewTab = () => {
    targetTab.style.opacity = '0';
    targetTab.classList.add('active');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetTab.style.opacity = '1';
      });
    });
  };

  if (activeTab) {
    activeTab.style.opacity = '0';

    const handleTransitionEnd = () => {
      activeTab.removeEventListener('transitionend', handleTransitionEnd);
      activeTab.classList.remove('active');
      showNewTab();
    };

    activeTab.addEventListener('transitionend', handleTransitionEnd, { once: true });
  } else {
    showNewTab();
  }

  if (button) {
    const activeButton = buttons.find(item => item.classList.contains('active'));
    if (activeButton) {
      activeButton.classList.remove('active');
    }
    button.classList.add('active');
  } else {
    setActiveButton(tabsGroup, targetTab.dataset.tab);
  }
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
