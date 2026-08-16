"use client";

import { Sidebar } from "@/components/Sidebar";
import { LibraryScreen } from "@/components/screens/LibraryScreen";
import { UploadScreen } from "@/components/screens/UploadScreen";
import { SourcesScreen } from "@/components/screens/SourcesScreen";
import { ReviewScreen } from "@/components/screens/ReviewScreen";
import { NotebookScreen } from "@/components/screens/NotebookScreen";
import { GradedScreen } from "@/components/screens/GradedScreen";
import { WeakScreen } from "@/components/screens/WeakScreen";
import { PracticeScreen } from "@/components/screens/PracticeScreen";
import { TimedScreen } from "@/components/screens/TimedScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { useExamPractice } from "@/hooks/useExamPractice";

export function ExamPracticeApp() {
  const state = useExamPractice();
  const { screen, go, papers } = state;

  return (
    <div
      id="exam-practice-root"
      style={{
        display: "flex",
        overflow: "hidden",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        fontSize: 15,
      }}
    >
      <Sidebar screen={screen} go={go} papers={papers} />
      <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {screen === "library" && <LibraryScreen state={state} />}
        {screen === "upload" && <UploadScreen state={state} />}
        {screen === "sources" && <SourcesScreen state={state} />}
        {screen === "review" && <ReviewScreen state={state} />}
        {screen === "notebook" && <NotebookScreen state={state} />}
        {screen === "timed" && <TimedScreen state={state} />}
        {screen === "graded" && <GradedScreen state={state} />}
        {screen === "weak" && <WeakScreen state={state} />}
        {screen === "practice" && <PracticeScreen state={state} />}
        {screen === "settings" && <SettingsScreen />}
      </main>
    </div>
  );
}
