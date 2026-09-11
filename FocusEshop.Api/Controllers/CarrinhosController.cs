using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarrinhosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CarrinhosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCarrinho([FromQuery] string cpfCnpj)
        {
            if (string.IsNullOrWhiteSpace(cpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            var limpo = new string(cpfCnpj.Where(char.IsDigit).ToArray());
            var carrinho = await _context.Carrinhos
                .Include(c => c.Itens)
                .FirstOrDefaultAsync(c => c.CpfCnpj == limpo);

            var itens = carrinho?.Itens
                .Select(i => new CarrinhoItemDto { ProdutoId = i.ProdutoId, Quantidade = i.Quantidade })
                .ToList() ?? new List<CarrinhoItemDto>();

            return Ok(itens);
        }

        [HttpPut]
        public async Task<IActionResult> SalvarCarrinho([FromQuery] string cpfCnpj, [FromBody] SalvarCarrinhoDto dto)
        {
            if (string.IsNullOrWhiteSpace(cpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            var limpo = new string(cpfCnpj.Where(char.IsDigit).ToArray());
            if (limpo.Length < 11)
                return BadRequest(new { message = "CPF/CNPJ inválido." });

            var carrinho = await _context.Carrinhos
                .Include(c => c.Itens)
                .FirstOrDefaultAsync(c => c.CpfCnpj == limpo);

            if (carrinho == null)
            {
                carrinho = new Carrinho { CpfCnpj = limpo, AtualizadoEm = DateTime.UtcNow };
                _context.Carrinhos.Add(carrinho);
                await _context.SaveChangesAsync();
            }

            _context.CarrinhoItens.RemoveRange(carrinho.Itens);
            carrinho.AtualizadoEm = DateTime.UtcNow;

            foreach (var item in dto.Itens.Where(i => i.Quantidade > 0))
            {
                carrinho.Itens.Add(new CarrinhoItem
                {
                    CarrinhoId = carrinho.Id,
                    ProdutoId = item.ProdutoId,
                    Quantidade = item.Quantidade
                });
            }

            await _context.SaveChangesAsync();
            return Ok(carrinho.Itens.Select(i => new CarrinhoItemDto { ProdutoId = i.ProdutoId, Quantidade = i.Quantidade }).ToList());
        }

        [HttpDelete]
        public async Task<IActionResult> LimparCarrinho([FromQuery] string cpfCnpj)
        {
            if (string.IsNullOrWhiteSpace(cpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            var limpo = new string(cpfCnpj.Where(char.IsDigit).ToArray());
            var carrinho = await _context.Carrinhos.FirstOrDefaultAsync(c => c.CpfCnpj == limpo);
            if (carrinho == null) return NoContent();

            _context.Carrinhos.Remove(carrinho);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
