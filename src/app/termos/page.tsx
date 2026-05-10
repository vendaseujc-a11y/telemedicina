export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-sky-500 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Termos de Uso do Serviço de Telemedicina</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">Ao utilizar nossos serviços de atendimento remoto, você concorda com as seguintes condições:</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Natureza do Atendimento</h3>
          <p className="text-gray-600 mb-4">A Telemedicina é uma ferramenta de suporte e consulta à distância. O médico avaliará se o seu caso é passível de resolução remota.</p>
          <p className="text-red-600 font-medium mb-8">⚠️ Em situações de emergência ou urgência, o paciente deve procurar imediatamente uma unidade de pronto atendimento presencial.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Limitações Tecnológicas</h3>
          <p className="text-gray-600 mb-4">O usuário é responsável por garantir:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-8">
            <li>Uma conexão estável de internet</li>
            <li>Um ambiente privado para a realização da consulta</li>
            <li>Visando manter a qualidade técnica e o sigilo das informações trocadas</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Prescrições Digitais</h3>
          <p className="text-gray-600 mb-8">As receitas, atestados e pedidos de exames emitidos possuem assinatura digital certificada, sendo válidos em todo o território nacional, conforme a legislação vigente.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Responsabilidades</h3>
          <p className="text-gray-600 mb-8">A plataforma não se responsabiliza por diagnósticos ou tratamentos realizados fora do ambiente virtual de consulta. A decisão final sobre qualquer procedimento médico é sempre do profissional de saúde.</p>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="inline-block bg-sky-500 text-white px-6 py-3 rounded-xl hover:bg-sky-600 font-medium">
            Voltar ao início
          </a>
        </div>
      </main>
    </div>
  );
}