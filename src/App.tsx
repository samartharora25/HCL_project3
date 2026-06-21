import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { UploadModule } from './components/UploadModule';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ParseResult } from './lib/parsing';
import { Button } from './components/ui';

function App() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleReset = () => {
    setParseResult(null);
  };

  return (
    <Layout>
      {!parseResult ? (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
          <UploadModule onDataReady={setParseResult} />
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0 }}>Analytics Dashboard</h2>
            <Button variant="outline" onClick={handleReset}>Upload New File</Button>
          </div>
          <AnalyticsDashboard parseResult={parseResult} />
        </div>
      )}
    </Layout>
  );
}

export default App;
