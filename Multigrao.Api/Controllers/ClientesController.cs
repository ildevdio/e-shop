using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetClientes()
        {
            var clientes = await _context.Clientes
                .Include(c => c.Contatos)
                .Include(c => c.Pedidos)
                .OrderBy(c => c.RazaoSocialNome)
                .ToListAsync();

            return Ok(clientes);
        }

        [HttpGet("busca")]
        public async Task<IActionResult> GetClientePorCpfCnpj([FromQuery] string cpfCnpj)
        {
            if (string.IsNullOrWhiteSpace(cpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            var limpo = new string(cpfCnpj.Where(char.IsDigit).ToArray());
            var cliente = await _context.Clientes
                .Include(c => c.Contatos)
                .FirstOrDefaultAsync(c => c.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == limpo);

            if (cliente == null) return NotFound(new { message = "Cliente não encontrado." });
            return Ok(cliente);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCliente(int id)
        {
            var cliente = await _context.Clientes
                .Include(c => c.Contatos)
                .Include(c => c.Pedidos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cliente == null) return NotFound();
            return Ok(cliente);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCliente([FromBody] CriarClienteDto dto)
        {
            var cliente = new Cliente
            {
                RazaoSocialNome = dto.RazaoSocialNome,
                NomeFantasia = dto.NomeFantasia ?? string.Empty,
                CpfCnpj = dto.CpfCnpj,
                TipoPessoa = dto.TipoPessoa ?? string.Empty,
                InscricaoEstadual = dto.InscricaoEstadual ?? string.Empty,
                InscricaoMunicipal = dto.InscricaoMunicipal ?? string.Empty,
                Cep = dto.Cep ?? string.Empty,
                Logradouro = dto.Logradouro ?? string.Empty,
                Numero = dto.Numero ?? string.Empty,
                Complemento = dto.Complemento ?? string.Empty,
                Bairro = dto.Bairro ?? string.Empty,
                Cidade = dto.Cidade ?? string.Empty,
                Estado = dto.Estado ?? string.Empty,
                Telefone = dto.Telefone ?? string.Empty,
                Email = dto.Email ?? string.Empty,
                RegimeTributario = dto.RegimeTributario ?? string.Empty
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarCliente(int id, [FromBody] CriarClienteDto dto)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();

            cliente.RazaoSocialNome = dto.RazaoSocialNome;
            cliente.NomeFantasia = dto.NomeFantasia ?? cliente.NomeFantasia;
            cliente.CpfCnpj = dto.CpfCnpj;
            cliente.TipoPessoa = dto.TipoPessoa ?? cliente.TipoPessoa;
            cliente.InscricaoEstadual = dto.InscricaoEstadual ?? cliente.InscricaoEstadual;
            cliente.InscricaoMunicipal = dto.InscricaoMunicipal ?? cliente.InscricaoMunicipal;
            cliente.Cep = dto.Cep ?? cliente.Cep;
            cliente.Logradouro = dto.Logradouro ?? cliente.Logradouro;
            cliente.Numero = dto.Numero ?? cliente.Numero;
            cliente.Complemento = dto.Complemento ?? cliente.Complemento;
            cliente.Bairro = dto.Bairro ?? cliente.Bairro;
            cliente.Cidade = dto.Cidade ?? cliente.Cidade;
            cliente.Estado = dto.Estado ?? cliente.Estado;
            cliente.Telefone = dto.Telefone ?? cliente.Telefone;
            cliente.Email = dto.Email ?? cliente.Email;
            cliente.RegimeTributario = dto.RegimeTributario ?? cliente.RegimeTributario;

            await _context.SaveChangesAsync();
            return Ok(cliente);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null) return NotFound();

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
