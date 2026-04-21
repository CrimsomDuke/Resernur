function App() {
  return (
    <div className="flex h-screen overflow-hidden antialiased bg-surface text-on-background">
      <nav className="h-screen w-72 flex flex-col fixed left-0 top-0 bg-surface-container-low border-none z-50">
        <div className="px-6 py-8">
          <div className="bg-gradient-to-br from-primary to-primary-container text-white p-4 rounded-md font-bold tracking-tighter flex items-center space-x-3 shadow-sm shadow-primary/10">
            <span className="material-symbols-outlined text-3xl" data-weight="fill">
              account_balance
            </span>
            <div>
              <h1 className="text-xl leading-tight font-headline">ScholarFlow</h1>
              <p className="text-xs font-medium text-white/80 font-body uppercase tracking-wider">
                Academic Curator
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full py-2 space-y-2 flex-grow overflow-y-auto">
          <a
            className="bg-white text-primary font-bold rounded-l-none rounded-r-full shadow-sm shadow-primary/5 px-6 py-3 mr-4 flex items-center space-x-4 font-headline tracking-tight text-sm"
            href="#"
          >
            <span className="material-symbols-outlined" data-weight="fill">
              dashboard
            </span>
            <span>Dashboard</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-primary px-6 py-3 transition-colors hover:bg-surface-container rounded-l-none rounded-r-full mr-4 flex items-center space-x-4 font-headline tracking-tight text-sm"
            href="#"
          >
            <span className="material-symbols-outlined">event_seat</span>
            <span>Reservations</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-primary px-6 py-3 transition-colors hover:bg-surface-container rounded-l-none rounded-r-full mr-4 flex items-center space-x-4 font-headline tracking-tight text-sm"
            href="#"
          >
            <span className="material-symbols-outlined">domain</span>
            <span>Resources</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-primary px-6 py-3 transition-colors hover:bg-surface-container rounded-l-none rounded-r-full mr-4 flex items-center space-x-4 font-headline tracking-tight text-sm"
            href="#"
          >
            <span className="material-symbols-outlined">monitor_heart</span>
            <span>System Health</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-primary px-6 py-3 transition-colors hover:bg-surface-container rounded-l-none rounded-r-full mr-4 flex items-center space-x-4 font-headline tracking-tight text-sm"
            href="#"
          >
            <span className="material-symbols-outlined">insights</span>
            <span>Analytics</span>
          </a>
        </div>

        <div className="p-6 space-y-6 mt-auto">
          <button className="w-full bg-gradient-to-r from-primary to-primary-container text-white rounded-md py-3 font-body font-medium shadow-[0_8px_32px_0_rgba(0,30,64,0.06)] hover:shadow-[0_8px_32px_0_rgba(0,30,64,0.12)] transition-shadow flex items-center justify-center space-x-2">
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Create Reservation</span>
          </button>
          <div className="space-y-2 border-t border-surface-container pt-4">
            <a
              className="text-on-surface-variant hover:text-primary px-2 py-2 transition-colors flex items-center space-x-4 font-headline tracking-tight text-sm rounded-md hover:bg-surface-container"
              href="#"
            >
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </a>
            <a
              className="text-on-surface-variant hover:text-primary px-2 py-2 transition-colors flex items-center space-x-4 font-headline tracking-tight text-sm rounded-md hover:bg-surface-container"
              href="#"
            >
              <span className="material-symbols-outlined">help</span>
              <span>Support</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="flex flex-col flex-1 ml-72 h-screen overflow-hidden bg-surface relative">
        <header className="flex justify-between items-center px-10 h-20 w-full bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_0_0_rgba(0,30,64,0.05)]">
          <div className="flex-1 flex items-center">
            <h2 className="font-headline text-xl font-bold text-primary tracking-tight">Admin Dashboard</h2>
          </div>

          <div className="flex-1 flex justify-end items-center space-x-6">
            <div className="relative w-64 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full bg-surface-container-high border-none rounded-md py-2 pl-10 pr-4 text-sm font-body text-on-surface placeholder:text-outline-variant border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all focus:bg-white shadow-inner"
                placeholder="Search resources..."
                type="text"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button className="text-outline hover:text-primary hover:bg-surface-bright rounded-full p-2 transition-all relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
              </button>
              <button className="text-outline hover:text-primary hover:bg-surface-bright rounded-full p-2 transition-all">
                <span className="material-symbols-outlined">history</span>
              </button>
              <button className="ml-4 focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
                <img
                  alt="Administrator Profile"
                  className="w-10 h-10 rounded-full border-2 border-surface-container-highest"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiBv_Ov5_UuCrRwqyEkcpWxJkt-CWWcPWXXPhbv2JDtHV8PMDyNwIYi4b0plGHXKHDikxVJ5ih72uExquitkvJQUT1G12hXG0GrI9ewMTqEoLnWMB3vqB9RTwwxecU3QtpAH8eWdDjhV9qfzzEHLURBT-ofj26l0NzQRmS2GVbPXy5U5DA7TFbrhOSgAkWjc0XbzeRIjZPAhttQ2TnqcdaoAXTmwvRJveP34yQffuXvrub_7JDDM5gHQs_wDc2_GcLcuPuH7Uos3Wk"
                />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_24px_0_rgba(0,30,64,0.03)] relative overflow-hidden group hover:shadow-[0_8px_32px_0_rgba(0,30,64,0.06)] transition-all">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-surface-container rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary-fixed rounded-md">
                  <span className="material-symbols-outlined text-primary" data-weight="fill">
                    group
                  </span>
                </div>
                <span className="text-xs font-bold text-secondary font-body uppercase tracking-widest">+12%</span>
              </div>
              <h3 className="text-outline font-body text-sm font-medium">Total Users</h3>
              <p className="text-3xl font-headline font-bold text-on-surface mt-1">12,450</p>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_24px_0_rgba(0,30,64,0.03)] relative overflow-hidden group hover:shadow-[0_8px_32px_0_rgba(0,30,64,0.06)] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-surface-container-high rounded-md">
                  <span className="material-symbols-outlined text-primary" data-weight="fill">
                    calendar_month
                  </span>
                </div>
              </div>
              <h3 className="text-outline font-body text-sm font-medium">Active Reservations</h3>
              <p className="text-3xl font-headline font-bold text-on-surface mt-1">842</p>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_24px_0_rgba(0,30,64,0.03)] relative overflow-hidden group hover:shadow-[0_8px_32px_0_rgba(0,30,64,0.06)] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-tertiary-fixed rounded-md">
                  <span className="material-symbols-outlined text-tertiary" data-weight="fill">
                    pending_actions
                  </span>
                </div>
                <span className="text-xs font-bold text-tertiary font-body uppercase tracking-widest bg-tertiary-fixed px-2 py-1 rounded">
                  Needs Review
                </span>
              </div>
              <h3 className="text-outline font-body text-sm font-medium">Pending Requests</h3>
              <p className="text-3xl font-headline font-bold text-on-surface mt-1">37</p>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-xl shadow-[0_8px_32px_0_rgba(0,30,64,0.1)] relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-9xl">monitor_heart</span>
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-md">
                  <span className="material-symbols-outlined text-white" data-weight="fill">
                    check_circle
                  </span>
                </div>
                <span className="text-xs font-bold text-primary-fixed font-body uppercase tracking-widest">Optimal</span>
              </div>
              <h3 className="text-white/80 font-body text-sm font-medium relative z-10">System Health</h3>
              <p className="text-3xl font-headline font-bold text-white mt-1 relative z-10">99.9%</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
