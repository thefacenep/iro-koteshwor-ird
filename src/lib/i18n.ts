import type { Lang } from "./format";

export type TKey = keyof typeof STRINGS;

export const STRINGS = {
  // identity
  govtNp: "नेपाल सरकार",
  govtEn: "Government of Nepal",
  ministry: { en: "Ministry of Finance", np: "अर्थ मन्त्रालय" },
  dept: { en: "Inland Revenue Department", np: "आन्तरिक राजस्व विभाग" },
  portal: { en: "Revenue Transparency Portal", np: "राजस्व पारदर्शिता पोर्टल" },
  tagline: {
    en: "Every rupee accounted. Open data for every citizen.",
    np: "हरेक रुपैयाँको हिसाब। हरेक नागरिकका लागि खुला तथ्याङ्क।",
  },
  dashboard_title: { en: "Revenue Collection Dashboard", np: "राजस्व संकलन ड्यासबोर्ड" },

  // nav
  nav_dashboard: { en: "Dashboard", np: "ड्यासबोर्ड" },
  nav_import: { en: "Data Import & Logs", np: "तथ्याङ्क आयात तथा लग" },
  board_mode: { en: "Display Board", np: "प्रदर्शन बोर्ड" },
  exit_board: { en: "Exit Board", np: "बोर्ड बन्द गर्नुहोस्" },
  board_hint: { en: "Tap left / right side to navigate · slides auto-advance", np: "बायाँ / दायाँ छेउ छुनुहोस् · स्लाइड आफैँ फेरिन्छ" },

  // auth
  login: { en: "Staff Login", np: "कर्मचारी प्रवेश" },
  logout: { en: "Log out", np: "बाहिर निस्कनुहोस्" },
  login_title: { en: "Secure staff access", np: "सुरक्षित कर्मचारी प्रवेश" },
  login_sub: {
    en: "Role-based access protects sensitive revenue data.",
    np: "भूमिका-आधारित पहुँचले संवेदनशील राजस्व तथ्याङ्क सुरक्षित राख्छ।",
  },
  username: { en: "Username", np: "प्रयोगकर्ता नाम" },
  password: { en: "Password", np: "पासवर्ड" },
  sign_in: { en: "Sign in", np: "साइन इन गर्नुहोस्" },
  cancel: { en: "Cancel", np: "रद्द गर्नुहोस्" },
  login_error: { en: "Invalid username or password. Try the demo accounts below.", np: "गलत प्रयोगकर्ता नाम वा पासवर्ड। तलका डेमो खाता प्रयोग गर्नुहोस्।" },
  demo_accounts: { en: "Demo accounts", np: "डेमो खाताहरू" },
  role_admin: { en: "Administrator", np: "प्रशासक" },
  role_viewer: { en: "Viewer", np: "अवलोकनकर्ता" },
  role_public: { en: "Public visitor", np: "सर्वसाधारण" },
  access_locked: { en: "Administrator access required", np: "प्रशासक पहुँच आवश्यक छ" },
  access_locked_desc: {
    en: "Data import, upload logs and exports are restricted to authorized IRD administrators. Sign in with an administrator account to continue.",
    np: "तथ्याङ्क आयात, लग र निर्यात अधिकृत प्रशासकका लागि मात्र सीमित छन्। जारी राख्न प्रशासक खाताबाट साइन इन गर्नुहोस्।",
  },
  logged_in_as: { en: "Signed in as", np: "साइन इन भएको" },

  // sync / offline
  sync_online: { en: "Online", np: "अनलाइन" },
  sync_offline: { en: "Offline", np: "अफलाइन" },
  sync_pending: { en: "pending sync", np: "सिंक बाँकी" },
  sync_now: { en: "Sync now", np: "अहिले सिंक गर्नुहोस्" },
  syncing: { en: "Syncing…", np: "सिंक हुँदै…" },
  last_sync: { en: "Last sync", np: "अन्तिम सिंक" },
  never: { en: "never", np: "कहिल्यै" },
  offline_banner: {
    en: "No internet connection — the portal keeps working offline. Imported records will sync automatically when connection returns.",
    np: "इन्टरनेट जडान छैन — पोर्टल अफलाइनमै चालु रहन्छ। आयात गरिएका तथ्याङ्क जडान फर्किएपछि स्वतः सिंक हुनेछन्।",
  },
  sync_done: { en: "All records synchronised with central server", np: "सबै तथ्याङ्क केन्द्रीय सर्भरसँग सिंक भयो" },
  saved_offline: { en: "Saved offline — will sync later", np: "अफलाइन सुरक्षित — पछि सिंक हुनेछ" },

  // KPI
  kpi_total_rev: { en: "Total Revenue Collected", np: "जम्मा राजस्व संकलन" },
  kpi_total_rev_sub: { en: "Current fiscal year to date", np: "चालु आर्थिक वर्ष" },
  kpi_achievement: { en: "Target Achievement", np: "लक्ष्य प्राप्ति" },
  kpi_achievement_sub: { en: "of Shrawan monthly target", np: "श्रावण मासिक लक्ष्यको" },
  kpi_growth: { en: "Year-on-Year Growth", np: "वार्षिक वृद्धि" },
  kpi_growth_sub: { en: "vs Shrawan 2082/83", np: "गत वर्ष श्रावण २०८२/०८३" },
  kpi_top_month: { en: "Best Collection Month", np: "सर्वोच्च संकलन महिना" },
  kpi_top_month_sub: { en: "Highest monthly collection", np: "मासिक उच्च संकलन" },
  of_target: { en: "of annual target", np: "वार्षिक लक्ष्यको" },
  annual_target: { en: "Annual target", np: "वार्षिक लक्ष्य" },
  unit_note: { en: "Figures in NPR billions (arba)", np: "आँकडा नेपाली रुपैयाँ अर्बमा" },

  // chart sections
  section_overview: { en: "Revenue Overview", np: "राजस्व अवलोकन" },
  section_monthly: { en: "Monthly Collection by Tax Category", np: "कर शीर्षक अनुसार मासिक संकलन" },
  section_monthly_sub: {
    en: "Stacked view — how each month's collection is composed across the five tax heads.",
    np: "थुप्रिएको दृश्य — हरेक महिनाको संकलन पाँच कर शीर्षकमा कसरी बाँडिएको छ।",
  },
  section_share: { en: "Share by Tax Head", np: "कर शीर्षक अनुसार हिस्सा" },
  section_share_sub: { en: "Contribution of each tax head to total revenue", np: "कुल राजस्वमा प्रत्येक कर शीर्षकको योगदान" },
  section_trend: { en: "Monthly Target vs Collection — 12 Month Trend", np: "मासिक लक्ष्य विरुद्ध संकलन — १२ महिने प्रवृत्ति" },
  section_trend_sub: {
    en: "Solid blue: target 2083/084 · Dashed red: collection 2082/083 · Green dot: current Shrawan collection already above both.",
    np: "मोटो निलो: लक्ष्य २०८३/०८४ · धर्सो रातो: संकलन २०८२/०८३ · हरियो थोप्लो: चालु श्रावण संकलन दुवैभन्दा माथि।",
  },
  section_compare: { en: "Target 2083/084 vs Collection 2082/083", np: "लक्ष्य २०८३/०८४ र संकलन २०८२/०८३" },
  section_compare_sub: {
    en: "Month-by-month comparison of the new annual target against last year's actual collection.",
    np: "नयाँ वार्षिक लक्ष्य र गत वर्षको वास्तविक संकलनको महिना-महिना तुलना।",
  },
  section_table: { en: "Historical Trend Analysis", np: "ऐतिहासिक प्रवृत्ति विश्लेषण" },
  section_table_sub: {
    en: "Month-by-month targets, achievement and growth. Scroll for all twelve months.",
    np: "महिना अनुसार लक्ष्य, प्राप्ति र वृद्धि। बाह्रै महिनाका लागि तल स्क्रोल गर्नुहोस्।",
  },

  // chart labels
  collected: { en: "Collected", np: "संकलन" },
  target: { en: "Target", np: "लक्ष्य" },
  prev_fy: { en: "Previous FY", np: "गत आ.व." },
  current_fy: { en: "Current FY", np: "चालु आ.व." },
  share: { en: "share", np: "हिस्सा" },
  total: { en: "Total", np: "जम्मा" },
  month_word: { en: "Month", np: "महिना" },
  achievement: { en: "Achievement", np: "प्राप्ति" },
  growth: { en: "Growth", np: "वृद्धि" },

  // table
  th_month: { en: "Month (BS)", np: "महिना (वि.सं.)" },
  th_target: { en: "Target", np: "लक्ष्य" },
  th_collected: { en: "Collected", np: "संकलन" },
  th_achieved: { en: "Achieved", np: "प्राप्ति %" },
  th_growth: { en: "YoY Growth", np: "वार्षिक वृद्धि" },
  th_status: { en: "Status", np: "स्थिति" },
  on_track: { en: "On track", np: "लक्ष्य अनुरुप" },
  needs_push: { en: "Needs push", np: "थप प्रयास आवश्यक" },
  behind: { en: "Behind", np: "पछाडि" },

  // import panel
  import_title: { en: "Automated Data Import", np: "स्वचालित तथ्याङ्क आयात" },
  import_sub: {
    en: "Upload Excel or CSV sheets exported from the revenue system. Rows are validated automatically — no manual entry.",
    np: "राजस्व प्रणालीबाट निर्यात भएका एक्सेल वा CSV सिट अपलोड गर्नुहोस्। पङ्क्तिहरू स्वतः जाँच हुन्छन् — म्यानुअल प्रविष्टि आवश्यक छैन।",
  },
  upload_title: { en: "Upload data file", np: "तथ्याङ्क फाइल अपलोड" },
  drop_hint: { en: "Drag & drop your file here, or", np: "फाइल यहाँ तान्नुहोस्, वा" },
  browse: { en: "Browse files", np: "फाइल छान्नुहोस्" },
  accepted: { en: "Accepts .xlsx, .xls, .csv · up to 5 MB", np: ".xlsx, .xls, .csv मान्य · ५ MB सम्म" },
  expected_cols: { en: "Expected columns", np: "आवश्यक स्तम्भहरू" },
  template_download: { en: "Download CSV template", np: "CSV टेम्प्लेट डाउनलोड" },
  demo_batch: { en: "Run demo batch (with sample errors)", np: "डेमो ब्याच चलाउनुहोस् (नमुना त्रुटिसहित)" },
  processing: { en: "Validating rows…", np: "पङ्क्ति जाँच हुँदैछ…" },
  preview_title: { en: "Row preview", np: "पङ्क्ति पूर्वावलोकन" },
  no_preview: { en: "No file processed yet. Upload a sheet to see validation results here.", np: "अहिलेसम्म कुनै फाइल प्रशोधन भएको छैन। नतिजा हेर्न सिट अपलोड गर्नुहोस्।" },

  // log + stats
  log_title: { en: "Real-time Import Log", np: "प्रत्यक्ष आयात लग" },
  log_empty: { en: "No log entries yet.", np: "अहिलेसम्म लग छैन।" },
  stat_uploads: { en: "Upload sessions", np: "अपलोड सत्र" },
  stat_success: { en: "Rows imported", np: "आयात भएका पङ्क्ति" },
  stat_failed: { en: "Rows failed", np: "असफल पङ्क्ति" },
  stat_warnings: { en: "Warnings", np: "चेतावनी" },
  filter_from: { en: "From", np: "देखि" },
  filter_to: { en: "To", np: "सम्म" },
  filter_status: { en: "Status", np: "स्थिति" },
  all: { en: "All", np: "सबै" },
  success: { en: "Success", np: "सफल" },
  error: { en: "Error", np: "त्रुटि" },
  warning: { en: "Warning", np: "चेतावनी" },
  info: { en: "Info", np: "जानकारी" },
  clear_filters: { en: "Clear", np: "खाली गर्नुहोस्" },
  export_logs_csv: { en: "Export logs CSV", np: "लग CSV निर्यात" },
  export_logs_json: { en: "Export logs JSON", np: "लग JSON निर्यात" },
  export_data_csv: { en: "Export data CSV", np: "तथ्याङ्क CSV निर्यात" },
  export_data_json: { en: "Export data JSON", np: "तथ्याङ्क JSON निर्यात" },
  export_done: { en: "Export ready — file downloaded", np: "निर्यात तयार — फाइल डाउनलोड भयो" },
  import_done: { en: "Import finished", np: "आयात सम्पन्न भयो" },
  entries: { en: "entries", np: "प्रविष्टि" },

  // log messages
  log_session_start: { en: "Import session started", np: "आयात सत्र सुरु भयो" },
  log_session_done: { en: "Import session finished", np: "आयात सत्र समाप्त भयो" },
  log_row_ok: { en: "Row accepted", np: "पङ्क्ति स्वीकृत" },
  log_row_dup: { en: "Possible duplicate — accepted with flag", np: "सम्भावित नक्कल — चिन्हसहित स्वीकृत" },
  log_row_outlier: { en: "Value unusually high — accepted with warning", np: "असामान्य उच्च मान — चेतावनीसहित स्वीकृत" },
  log_err_missing: { en: "Missing required value", np: "आवश्यक मान छैन" },
  log_err_category: { en: "Unknown tax category", np: "अज्ञात कर शीर्षक" },
  log_err_month: { en: "Invalid month (use 1–12 or BS month name)", np: "अमान्य महिना (१–१२ वा नेपाली महिना नाम प्रयोग गर्नुहोस्)" },
  log_err_numeric: { en: "Amount must be a number", np: "रकम अङ्कमा हुनुपर्छ" },
  log_err_negative: { en: "Amount cannot be negative", np: "रकम ऋणात्मक हुन सक्दैन" },
  log_file_ok: { en: "File parsed successfully", np: "फाइल सफलतापूर्वक पढियो" },
  log_file_err: { en: "Could not read file", np: "फाइल पढ्न सकिएन" },
  log_sync: { en: "Records synchronised with central server", np: "तथ्याङ्क केन्द्रीय सर्भरसँग सिंक भयो" },

  // footer
  footer_about: {
    en: "This portal publishes unaudited provisional revenue figures for public transparency. Figures are updated automatically from the Integrated Tax System and may be revised after audit.",
    np: "यो पोर्टलले सार्वजनिक पारदर्शिताका लागि अलेखापरीक्षण भएका अस्थायी राजस्व आँकडा प्रकाशित गर्दछ। आँकडा एकीकृत कर प्रणालीबाट स्वतः अपडेट हुन्छन् र लेखापरीक्षणपछि संशोधन हुन सक्छन्।",
  },
  footer_helpline: { en: "Citizen helpline", np: "नागरिक हेल्पलाइन" },
  footer_updated: { en: "Data last updated", np: "तथ्याङ्क अन्तिम अपडेट" },
  footer_rights: { en: "Inland Revenue Department · Babarmahal, Kathmandu", np: "आन्तरिक राजस्व विभाग · बबरमहल, काठमाडौँ" },
  footer_lang: { en: "Available in नेपाली and English", np: "नेपाली र English मा उपलब्ध" },

  // office (Koteshwor) data upload
  office_name: { en: "Inland Revenue Office Koteshwor", np: "आन्तरिक राजस्व कार्यालय कोटेश्वर" },
  office_kicker: { en: "Office Data Console", np: "कार्यालय तथ्याङ्क कन्सोल" },
  upload_main_title: { en: "Upload Revenue Target & Collection Data", np: "राजस्व लक्ष्य तथा संकलन तथ्याङ्क अपलोड गर्नुहोस्" },
  upload_main_sub: { en: "Drag and drop your Excel (.xlsx) file here, or click to browse.", np: "आफ्नो एक्सेल (.xlsx) फाइल यहाँ तानेर छोड्नुहोस्, वा क्लिक गरेर छान्नुहोस्।" },
  browse_files: { en: "Browse Files", np: "फाइल छान्नुहोस्" },
  upload_excel_note: {
    en: "Excel workbook (.xlsx / .xls) · parsed automatically with SheetJS",
    np: "एक्सेल वर्कबुक (.xlsx / .xls) · स्वतः प्रशोधन हुन्छ",
  },
  upload_success_title: { en: "Upload successful", np: "अपलोड सफल भयो" },
  upload_success_msg: {
    en: "Your figures are now live on the dashboard and the display board.",
    np: "तपाईंका आँकडा अब ड्यासबोर्ड र डिस्प्ले बोर्डमा लाइभ छन्।",
  },
  routed_rows: { en: "rows routed to display board", np: "पङ्क्ति डिस्प्ले बोर्डमा पठाइयो" },
  office_data_active: {
    en: "Displaying office dataset — Inland Revenue Office Koteshwor",
    np: "कार्यालय तथ्याङ्क देखाइँदै — आन्तरिक राजस्व कार्यालय कोटेश्वर",
  },
  office_data_sub: {
    en: "Uploaded target & collection figures are live on this dashboard and the display board.",
    np: "अपलोड गरिएका लक्ष्य तथा संकलन आँकडा यो ड्यासबोर्ड र डिस्प्ले बोर्डमा लाइभ छन्।",
  },
  restore_national: { en: "Restore national dataset", np: "राष्ट्रिय तथ्याङ्क फर्काउनुहोस्" },
  national_restored: { en: "National dataset restored", np: "राष्ट्रिय तथ्याङ्क फर्काइयो" },
  open_board: { en: "Open display board", np: "डिस्प्ले बोर्ड खोल्नुहोस्" },
  office_demo: { en: "Load demo office sheet", np: "डेमो कार्यालय सिट लोड गर्नुहोस्" },
  uploaded_file: { en: "Uploaded file", np: "अपलोड फाइल" },
  uploaded_at: { en: "Uploaded at", np: "अपलोड समय" },
  office_cols_note: {
    en: "Columns: month · target · collected · category (optional). Amounts in billions (arba).",
    np: "स्तम्भहरू: महिना · लक्ष्य · संकलन · शीर्षक (ऐच्छिक)। रकम अर्बमा।",
  },

  // misc
  loading_portal: { en: "Loading portal…", np: "पोर्टल लोड हुँदैछ…" },
  data_updated: { en: "Updated", np: "अपडेट" },
  fiscal_year: { en: "Fiscal Year", np: "आर्थिक वर्ष" },
  rows: { en: "rows", np: "पङ्क्ति" },
  file: { en: "File", np: "फाइल" },
  time: { en: "Time", np: "समय" },
  message: { en: "Message", np: "सन्देश" },
  font_size: { en: "Text size", np: "अक्षर आकार" },
  language_label: { en: "भाषा / Language", np: "भाषा / Language" },
  close: { en: "Close", np: "बन्द गर्नुहोस्" },
  go_back: { en: "Back to dashboard", np: "ड्यासबोर्डमा फर्कनुहोस्" },
  secure_note: {
    en: "Protected by role-based access control. All import activity is logged.",
    np: "भूमिका-आधारित पहुँच नियन्त्रणद्वारा सुरक्षित। सबै आयात गतिविधि लग गरिन्छ।",
  },

  /* ---- real office dataset (Book1.xlsx / Revenue target of each month.xlsx) ---- */
  kpi_collected_shrawan: { en: "Revenue Collected · Shrawan to Date", np: "राजस्व संकलन · श्रावण महिना सम्मको" },
  thousand_npr: { en: "Thousand NPR", np: "हजार रुपैयाँ" },
  crore_word: { en: "crore", np: "करोड" },
  kpi_annual_target: { en: "Annual Target 2083/084", np: "वार्षिक लक्ष्य २०८३/०८४" },
  series_target: { en: "Target 2083/084", np: "लक्ष्य २०८३/०८४" },
  series_prev: { en: "Collection 2082/083", np: "संकलन २०८२/०८३" },
  series_current: { en: "Collection 2083/084", np: "संकलन २०८३/०८४" },
  gap_needed: { en: "Additional needed to reach target", np: "लक्ष्य पुग्न थप आवश्यक" },
  unit_thousand_note: { en: "Figures in thousand NPR", np: "आँकडा हजार रुपैयाँमा" },
  section_gap: { en: "Growth Needed to Reach Target", np: "लक्ष्य पुग्न आवश्यक वृद्धि" },
  section_gap_sub: {
    en: "Each bar stacks last year's collection with the extra amount required to hit the 2083/084 monthly target.",
    np: "हरेक बारमा गत वर्षको संकलन र २०८३/०८४ को मासिक लक्ष्य पुग्न आवश्यक थप रकम देखिन्छ।",
  },
  section_quarter: { en: "Annual Target Share by Quarter", np: "त्रैमास अनुसार वार्षिक लक्ष्यको हिस्सा" },
  section_quarter_sub: {
    en: "How the 612.17 crore annual target is distributed across the four quarters.",
    np: "६१२.१७ करोडको वार्षिक लक्ष्य चार त्रैमासमा कसरी बाँडिएको छ।",
  },
  table_note: {
    en: "Source: office Excel sheets · all amounts in thousand NPR",
    np: "स्रोत: कार्यालय एक्सेल सिट · सबै रकम हजार रुपैयाँमा",
  },
  import_formats: { en: "Supported sheet formats", np: "समर्थित सिट ढाँचाहरू" },
  format_matrix: {
    en: "Monthly matrix — month columns SHRAWAN…ASAR with Target / Collection rows",
    np: "मासिक म्याट्रिक्स — महिना स्तम्भ श्रावण…असार र लक्ष्य / संकलन पङ्क्तिहरू",
  },
  format_heads: {
    en: "Revenue-head summary — headers राजस्व शीर्षक · वार्षिक लक्ष्य · महिनाको असुली",
    np: "राजस्व शीर्षक सारांश — हेडर राजस्व शीर्षक · वार्षिक लक्ष्य · महिनाको असुली",
  },
  load_matrix_demo: { en: "Load monthly-matrix demo", np: "मासिक म्याट्रिक्स डेमो लोड" },
  load_book1_demo: { en: "Load Book1 demo (revenue heads)", np: "Book1 डेमो लोड (राजस्व शीर्षक)" },
  updated_live: { en: "Dashboard & display board updated instantly", np: "ड्यासबोर्ड र प्रदर्शन बोर्ड तुरुन्तै अपडेट भयो" },
  restore_seeded: { en: "Restore official seeded data", np: "आधिकारिक सिड तथ्याङ्क फर्काउनुहोस्" },
  office_live_data: { en: "Live office dataset", np: "प्रत्यक्ष कार्यालय तथ्याङ्क" },
  parsed_rows: { en: "rows parsed", np: "पङ्क्ति पढियो" },
  head_name: { en: "Revenue head", np: "राजस्व शीर्षक" },
  head_target: { en: "Annual target", np: "वार्षिक लक्ष्य" },
  head_collected: { en: "Collected (Shrawan)", np: "असुली (श्रावण)" },
  upload_success: { en: "Upload successful", np: "अपलोड सफल भयो" },
} as const;

export function translate(key: TKey, lang: Lang): string {
  const v = STRINGS[key];
  if (typeof v === "string") return v;
  return (v as { en: string; np: string })[lang];
}
