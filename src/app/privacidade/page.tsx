export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Nossa plataforma prioriza a confidencialidade do seu histórico médico</h2>
          <p className="text-gray-600 mb-8">Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), tratamos seus dados com o máximo cuidado.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Tratamento de Dados Pessoais e Sensíveis</h3>
          <p className="text-gray-600 mb-4">Além de dados cadastrais (nome, CPF, contato), coletamos dados sensíveis de saúde, como histórico clínico, sintomas e prescrições.</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4">
            <li><strong>Finalidade:</strong> Estes dados são utilizados estritamente para a prestação de assistência à saúde e diagnóstico remoto.</li>
            <li><strong>Base Legal:</strong> O tratamento é fundamentado na Tutela da Saúde e no consentimento do paciente.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Sigilo Médico e Armazenamento</h3>
          <p className="text-gray-600 mb-4">As consultas por vídeo e os prontuários digitais seguem o sigilo médico. As informações são armazenadas em servidores criptografados e com acesso restrito, mantendo a integridade do prontuário eletrônico conforme as normas do CFM.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Direitos do Titular</h3>
          <p className="text-gray-600 mb-4">Você pode, a qualquer momento, solicitar:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-8">
            <li>O acesso ao seu prontuário</li>
            <li>A correção de dados incompletos</li>
            <li>A portabilidade das suas informações para outro profissional de saúde</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">🔐 Segurança e Transparência</h3>
          <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Gravação de Consultas</h4>
          <p className="text-gray-600 mb-4">As consultas por videoconferência não são gravadas sem o consentimento expresso e documentado de ambas as partes (médico e paciente), respeitando a privacidade e a ética profissional.</p>

          <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Compartilhamento com Terceiros</h4>
          <p className="text-gray-600 mb-8">Seus dados de saúde nunca são vendidos. Eles podem ser compartilhados apenas com laboratórios ou farmácias, mediante sua solicitação, ou para cumprimento de obrigações legais (como notificações compulsórias de doenças).</p>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="inline-block bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark font-medium">
            Voltar ao início
          </a>
        </div>
      </main>
    </div>
  );
}